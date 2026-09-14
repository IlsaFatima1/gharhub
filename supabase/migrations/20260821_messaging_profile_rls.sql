-- Allow conversation members to read each other's profiles
-- so InboxPage can display real names and avatars.

drop policy if exists "conversation members read profiles" on public.profiles;
create policy "conversation members read profiles"
  on public.profiles for select
  to authenticated
  using(
    exists(
      select 1
      from public.conversation_members cm1
      join public.conversation_members cm2
        on cm1.conversation_id = cm2.conversation_id
      where cm1.user_id = auth.uid()
        and cm2.user_id = profiles.user_id
    )
  );
