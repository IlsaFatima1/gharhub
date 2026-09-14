# Todo

## In Progress

- [ ] Fix messaging loading bug: Messages page shows "Loading..." indefinitely after clicking Message icon

## Pending

- [ ] Debug client-side `refresh()` → `openForProperty()` → `navigate()` flow in MessagingProvider
- [ ] Fix snapshot update timing in `openForProperty` — may need to inject conversation directly
- [ ] Clean up old broken conversation `a2c91267` (references non-existent property)

## Completed

- [x] Configure OpenCode multi-agent system with 13 specialized agents
- [x] Add Message icon next to WhatsApp on property cards
- [x] Apply messaging DB schema (tables, RLS, RPCs, functions, realtime, storage)
- [x] DB diagnostics — conversations exist, RPC works, RLS correct
