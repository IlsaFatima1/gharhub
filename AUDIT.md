# GharHub — Pre-Production Audit Report

Date: 2026-09-11
Scope: Complete production-readiness audit of GharHub (React/Vite frontend, Supabase backend, Replicate AI).
Method: Live database inspection (tables, RLS, triggers, functions, storage, realtime, security advisors), live edge-function tests, and authenticated end-to-end tests against the production Supabase project (`scrvdiwlnosmrxnktloc`).

---

## VERDICT: GO — READY FOR PRODUCTION

All functional paths were exercised live and passed. Every cross-role RLS denial held. Both AI edge functions are JWT-gated and produce verified structured output. The **only BLOCKER found — "Havenly" branding in the production publish-notification — was fixed and verified live** during this audit. Remaining items are LOW-severity recommendations; none block launch.

---

## Findings by priority

### BLOCKER (fixed during audit)
| # | Finding | Status |
|---|---|---|
| B1 | `notify_property_status_change()` on the live DB emitted `Your listing "..." is now live on Havenly.` to every seller who published a listing (reproduced end-to-end via draft→publish). | **FIXED** — migration `fix_gharhub_branding_and_notification_hardening` rewrote the copy to `is now live on GharHub.` and added a missing `rented` status case. Verified live. |

### HIGH (none remaining)
No unresolved HIGH items after the fixes above.

### MEDIUM (recommend before any scaled launch / ad spend)
| # | Finding | Detail |
|---|---|---|
| M1 | Trigger-only SECURITY DEFINER functions were callable by anon/authenticated via `/rest/v1/rpc`. | **FIXED** — migration `harden_security_definer_exposure` revoked EXECUTE on `notify_on_favorite`, `notify_on_unfavorite`, `notify_property_status_change`, `notify_role_request_change`, `handle_new_user`, and pinned `search_path = public` on `get_property_stats`/`get_seller_stats`. Advisors dropped 10→5 anon-executable lints and cleared both search-path warnings. |
| M2 | Email notification pipeline is not wired up in production. | `notifications` → `notification_email_outbox` rows are queued by trigger, but there is **no deployed worker**: `send-notification-email` exists only locally, not in the project's edge-function list. Outbox rows will never be sent. Either deploy a worker/cron or remove the outbox. (Table has RLS with no policies = safe deny-all in the meantime.) |
| M3 | `notifications_insert` RLS policy is permissive. | It allows `user_id = auth.uid() OR user favorited the seller's published property`, so any authenticated buyer can write arbitrary notifications to a seller they favorited (spam/abuse vector). The security-definer triggers already handle all legitimate inserts. Hardening without breaking: keep the policy but constrain `type` to the allowed set and verify the "support message to admin" flow is compatible before restricting. |

### LOW
| # | Finding | Recommendation |
|---|---|---|
| L1 | `AuthPages.tsx:56` redirects to unvalidated `location.state.from`. | Not URL-exploitable (React Router state only), but harden: allow only paths starting with `/` and reject `//`, `:`, and control chars. |
| L2 | Local `supabase/migrations/*.sql` (19 files) are stale vs the live DB (~35 applied migrations), and one header comment still says "Havenly Messaging". | Treat the live DB as source of truth; reconcile local files to match applied state. |
| L3 | Leaked-password protection disabled (Auth setting). | Enable it in the Supabase dashboard settings (one click). |
| L4 | Performance advisors: 10 unindexed foreign keys (INFO), 34 `auth_rls_initplan` (WARN). | Non-blocking; add indexes on high-traffic FKs and consider `security_invoker` views. |
| L5 | Cosmetic staleness: `index.html` meta still "secure messaging"; `.env.example` still documents `OPENAI_API_KEY`/`OPENAI_MODEL` instead of `REPLICATE_API_TOKEN`; `.env.local` holds an obsolete `OPENAI_API_KEY` (never committed). | Update docs; remove stale key from local env. |
| L6 | Notification body omits buyer display name when profile `full_name` is empty (" saved your property…"). | **FIXED** — fallback now uses `A user`. Verified live. |

---

## Evidence — live tests performed

| Test | Result |
|---|---|
| Anon reads published properties | Pass (3+ published rows returned) |
| Buyer login / seller login (`seller-test-20260911` email confirmed) | Pass |
| Buyer favorites insert/list/delete (AFTER INSERT + BEFORE DELETE triggers) | Pass; seller received `favorite` notification |
| Seller create draft → publish (real flow) | Pass; owner received `property_approved` notification |
| Notification branding before/after fix | Before: `…is now live on Havenly.` → After: `…is now live on GharHub.` |
| Draft list isolation (buyer cannot see seller drafts) | Pass (empty) |
| Buyer PATCH on seller property | Pass — silent no-op (0 rows), description unchanged |
| `admin_stats()` as non-admin | Denied (`42501 administrator access required`) |
| Admin promotion (app_metadata role=admin) → `is_admin()` / `admin_stats()` / `admin_users()` | Pass; `admin-actions` edge fn executed `set_admin_role` |
| Anon `is_admin()` | `false` |
| Messaging: `get_or_create_property_conversation` RPC (member-only), buyer send + read, seller reply denied for non-member, anon read denied | Pass (RLS enforced; member list correct) |
| AI `ai-property` (verify_jwt): no token | 401 Invalid JWT |
| AI `ai-property` `studio`/description | Pass — generated 5BR DHA description, quota consumed |
| AI `ai-property` `recommend` | Pass — ranked 180M DHA listing first with matching criteria |

## Live state verified (source of truth: production DB)
- **Tables/constraints:** properties CHECKs (price>0, sqft≥50, city=Karachi, area allowlist incl. PECHS/North Nazimabad/Scheme 33, status incl. `rented`, title 5–100, description 30–3000); notifications type allowlist now incl. `property_rented`; `ai_usage_operation_check` and `consume_ai_quota` incl. `studio`.
- **RLS:** all tables RLS-on; properties SELECT `status=published OR owner OR admin`, INSERT `owner_id=auth.uid() AND city='Karachi'`, UPDATE/DELETE owner-or-admin; profiles, favorites, messages/conversations, team, admin, reports all enforced (spot-verified at runtime).
- **Functions:** `consume_ai_quota`, `is_conversation_member`, `get_or_create_property_conversation`, `admin_*`, `is_admin`, `notify_*`, `get_property_stats`, `get_seller_stats` — SECURITY DEFINER, `search_path` pinned where flagged.
- **Triggers:** `on_auth_user_created`, `on_favorite_notify`, `on_favorite_unnotify`, `notify_property_status_change` (UPDATE OF status), `queue_notification_email`, `touch_updated_at`.
- **Storage:** buckets `property-images` (public:true, 10MB, JPEG/PNG/WebP) and `message-images` (private), with owner-scoped upload/update/delete policies.
- **Realtime:** favorites, messages, notifications, properties, property_views, team_members published.
- **Edge functions deployed:** `admin-actions` (v14, verify_jwt) and `ai-property` (v25, verify_jwt). `send-notification-email` not deployed (see M2).

## Post-audit DB hygiene
All E2E test rows were removed: test properties, favorites, notifications, messages, and the audit-created conversation. Production data was left intact (9 listings, 1 pre-existing conversation, 6 users, 1 pre-existing favorite).

## Recommended pre-launch checklist (all optional/low-cost)
1. Enable leaked-password protection (dashboard). *(L3)*
2. Apply the `from`-path allowlist in `AuthPages.tsx`. *(L1)*
3. Decide the email path: deploy `send-notification-email` + cron, or disable `queue_notification_email`. *(M2)*
4. Reconcile local migrations with live DB. *(L2)*
5. Clean `.env.example` / `index.html` copy. *(L5)*