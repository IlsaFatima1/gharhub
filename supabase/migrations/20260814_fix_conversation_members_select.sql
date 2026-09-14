-- Fix RLS on conversation_members.
--
-- A policy on conversation_members must NOT query conversation_members inside
-- its own USING clause — that triggers infinite recursion (the exact error
-- "infinite recursion detected in policy for relation conversation_members").
-- We break the loop with a SECURITY DEFINER helper that bypasses RLS.
create or replace function public.is_conversation_member(target_conversation uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation and user_id = auth.uid()
  );
$$;

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_conversation_member(conversation_id)
  );
