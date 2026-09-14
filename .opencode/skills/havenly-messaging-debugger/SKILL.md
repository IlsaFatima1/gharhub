---
name: havenly-messaging-debugger
description: Deep debugging and implementation skill for Havenly buyer-seller messaging using React/Vite, TypeScript, Supabase Auth/Postgres/RLS/Realtime.
---

# Havenly Messaging Debugger

## Mission
Make the Havenly buyer ↔ seller messaging flow work end-to-end. Never stop at a plausible diagnosis. Reproduce, trace, fix the root cause, and verify with the running app and database.

Expected flow:
Message click → authenticated buyer → property/seller verified → existing conversation found or atomically created → conversation loaded → messages loaded → send works → seller receives in realtime → seller replies → buyer receives → refresh preserves chat.

## Mandatory rules
- Do not guess from static code alone.
- Do not call it fixed just because TypeScript/Vite builds.
- Do not replace Supabase messaging with mock/local data.
- Never disable RLS to make chat work.
- Never expose a service-role key in browser code.
- Use one Supabase client.
- Never silently swallow async/Supabase errors.
- Do not hide an infinite loader by changing only UI state.
- Preserve existing Havenly architecture/UI unless a change is required.

## Inspect first
Read the complete messaging path before editing:
- `MessagingProvider.tsx`
- `InboxPage.tsx` and chat components
- property Message button/icon
- `lib/supabase.ts`
- `lib/auth.tsx`
- property repository/types
- every messaging SQL migration
- `conversations`
- `conversation_members`
- `messages`
- RPCs such as `get_or_create_property_conversation` and `mark_conversation_read`
- Supabase Realtime subscriptions
- message notification triggers

Search the repository for:
`conversations`, `conversation_members`, `messages`, `get_or_create_property_conversation`, `mark_conversation_read`, `postgres_changes`, `realtime`, `openForProperty`, `sendMessage`.

## Runtime-first debugging
Add temporary logs only where necessary and trace:
`Message click → openForProperty → RPC → conversation id → conversation load → message load → selected state → Realtime subscription → send → DB row → Realtime event → UI state`.

For every async step capture operation, user id, property id, seller id, conversation id, Supabase error/status, promise result, and state transition.

Find the FIRST divergence between expected and actual behavior. Fix that cause. Remove temporary debug logs after verification.

## RLS audit
Verify actual live policies.

`conversation_members` must not have a policy that recursively queries itself. If membership checks are needed, use a safe `SECURITY DEFINER` helper with a fixed `search_path`.

Users must:
- read only conversations they belong to
- read only messages from conversations they belong to
- insert messages only as themselves
- insert only into conversations they belong to

RPCs must verify `auth.uid()`, property existence/published status where required, buyer/seller relationship, seller ownership, and self-messaging. Do not solve RLS by making tables public.

## Conversation identity
For property messaging, logical identity is:
`property_id + buyer_id + seller_id`

On Message click:
1. authenticate buyer
2. obtain/verify property owner
3. reject self-messaging
4. find existing conversation
5. otherwise create exactly one atomically
6. create required members
7. return conversation id
8. load that exact conversation and its messages

Prevent race-condition duplicates with database constraints or an atomic RPC.

## Client state
Clearly distinguish:
- initial loading
- refreshing conversations
- opening conversation
- loading messages
- sending
- realtime status
- error

Every async operation needs a timeout/failure path and useful error. No infinite `Loading...`.

`openForProperty()` must await the complete flow and verify that the conversation and messages actually loaded before navigation/showing the chat. On failure, display the real error and remain recoverable.

## Realtime
Use one Supabase client. Verify channel creation, subscription status, RLS authorization, INSERT delivery, cleanup, stale closures, duplicate subscriptions, duplicate optimistic/database events, and reconnect behavior.

If `Multiple GoTrueClient instances detected` appears, locate and remove duplicate client creation.

## Sending
A send must:
1. verify authenticated user
2. verify selected conversation
3. validate content/attachment
4. insert using authenticated identity
5. consume returned row
6. update UI once
7. show real errors
8. deliver the INSERT to the other participant through Realtime

Never fake success.

## Property Message button
Verify the button passes correct property id and seller/owner id. Browser-supplied seller ids are not trusted for authorization; database/RPC verifies ownership. Never navigate to an unloaded/dead conversation.

## Verification
Run the project's build and lint commands.

Use TWO real accounts:
A = seller/owner
B = buyer

Test:
1. A publishes property.
2. B sees it in Discover.
3. B clicks Message.
4. Chat opens without infinite loading.
5. B sends a message.
6. A receives it without refresh.
7. A replies.
8. B receives it without refresh.
9. Refresh B; conversation remains.
10. Click Message again; same conversation is reused.
11. Test unauthorized conversation access.
12. Test sender impersonation.
13. Test logged-out user, invalid property, unpublished property, self-message, expired session, network failure, and Realtime reconnect.

## Definition of done
Do not report fixed until:
- correct buyer-seller chat opens
- no infinite loading
- messages load
- sending works
- realtime works both ways
- refresh preserves chat
- duplicate conversations are prevented
- RLS remains enabled and secure
- no dummy messaging data remains
- build passes
- two-account runtime flow passes

Final report must contain:
1. root cause
2. files changed
3. SQL/migrations changed
4. exact verification performed
5. remaining limitations, if any
