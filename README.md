# GharHub — Property Marketplace

GharHub is a property marketplace for Karachi, Pakistan: verified listings for sale and rent, AI-powered search, exact map locations, secure buyer–seller messaging, and professional property management.

- Website: https://www.gharhub.site
- Repository: https://github.com/IlsaFatima1/gharhub

## Stack

- React 19 + TypeScript + Vite 7, React Router 7, Tailwind CSS 4, Framer Motion
- Supabase (Auth, Postgres, RLS, Realtime, Storage, Edge Functions)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
```

Other scripts:

```bash
npm run build      # tsc -b && vite build (prebuild regenerates public/sitemap.xml)
npm run preview    # serve the production build locally
npm run lint       # eslint
npm run sitemap    # regenerate public/sitemap.xml only
```

## Supabase configuration (required)

Project: `scrvdiwlnosmrxnktloc`.

**Authentication → URL Configuration**

| Setting | Value |
| --- | --- |
| Site URL | `https://www.gharhub.site` |
| Redirect URLs (production) | `https://www.gharhub.site/**` |
| Redirect URLs (local dev) | `http://localhost:5173/**`, `http://localhost:3000/**` |

> A `redirect_to` that is not in the allowlist is **silently rewritten to the Site URL** by GoTrue (the request still returns `200`). Without the localhost entries, password-reset emails opened during development land on production instead of the local server.

**Edge Functions** (all require a JWT):

| Function | Purpose |
| --- | --- |
| `admin-actions` | Admin panel operations |
| `ai-property` | AI listing/assistant calls (server-side OpenAI key) |
| `audit-auth-link` | Decommissioned stub — safe to delete from the dashboard |

## Password reset flow

1. `/forgot-password` posts the email to `supabase.auth.resetPasswordForEmail` with `redirectTo = ${window.location.origin}/reset-password`.
2. GoTrue emails a **single-use** link that expires after 1 hour. Mail clients that prefetch links can consume the token before it is opened — the app then shows **Link expired → Request a new link** instead of a dead form.
3. The link opens `/reset-password`. `src/lib/auth.tsx` handles the `PASSWORD_RECOVERY` event explicitly (Supabase emits it instead of `SIGNED_IN` for recovery callbacks). The recovery session is tracked with `isRecovery` + the `gharhub:password-recovery` localStorage flag, so:
   - a recovery user is never redirected to the dashboard by the normal authenticated-user routes;
   - the flag is only honoured while a recovery session actually exists (a stale flag can never lock the user out of `/login`);
   - "Back to sign in" cancels the recovery session so the user can sign in with their existing password.
4. Submitting calls `supabase.auth.updateUser({ password })`. On success the session is kept, the recovery flag is cleared, and the user reaches the dashboard via **Continue to dashboard**.

Related code: `src/lib/auth.tsx`, `src/features/auth/AuthPages.tsx`, `src/App.tsx` (`RecoveryRouteGuard`).

## Deployment

Pushes to `main` are deployed by Vercel through the GitHub integration (project `rncjsm`). The build runs `npm run build`; `scripts/generate-sitemap.mjs` refreshes `public/sitemap.xml` during `prebuild`.

## Project layout

```
src/App.tsx                 routes + RecoveryRouteGuard
src/lib/auth.tsx            auth context, recovery handling, session/profile mapping
src/lib/supabase.ts         Supabase client (persistSession, detectSessionInUrl)
src/lib/site.ts             canonical site URL
src/components/             shared UI (PageTransition, ui primitives)
src/features/               feature pages: auth, dashboard, properties, ai, admin, messaging, ...
scripts/generate-sitemap.mjs
public/sitemap.xml           generated
AUDIT.md                    pre-production audit report
```

## Notes

- Never commit real keys. `.env.example` is the only env file tracked; `.env.local` is ignored.
- Server-only secrets (`OPENAI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, …) belong in Supabase Edge Function secrets — never in `VITE_*` variables.
