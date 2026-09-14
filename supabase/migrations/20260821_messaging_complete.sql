-- ============================================================
-- Havenly Messaging — complete, idempotent setup
-- Paste this entire file into the Supabase SQL Editor and run it.
-- Safe to run multiple times (uses IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

create extension if not exists pgcrypto;

-- 1. Tables ----------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  kind text not null check (kind in ('text','image')),
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (body <> '' or image_url is not null)
);

create index if not exists messages_conversation_cursor_idx on public.messages (conversation_id, created_at desc, id desc);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id, conversation_id);
create index if not exists properties_id_status_idx on public.properties (id, status);

-- 2. Row Level Security ---------------------------------------
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "members read conversations" on public.conversations;
create policy "members read conversations" on public.conversations
  for select using (exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));

-- IMPORTANT: a policy on conversation_members must NOT query conversation_members
-- inside its own USING clause — that causes infinite recursion. We break the loop
-- with a SECURITY DEFINER helper that bypasses RLS.
create or replace function public.is_conversation_member(target_conversation uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation and user_id = auth.uid()
  );
$$;

drop policy if exists "conversation_members_select" on public.conversation_members;
create policy "conversation_members_select" on public.conversation_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists "members read messages" on public.messages;
create policy "members read messages" on public.messages
  for select using (exists (select 1 from public.conversation_members m
                            where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));

drop policy if exists "members send messages" on public.messages;
create policy "members send messages" on public.messages
  for insert with check (sender_id = auth.uid()
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));

drop policy if exists "recipient updates receipts" on public.messages;
create policy "recipient updates receipts" on public.messages
  for update using (sender_id <> auth.uid()
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()))
  with check (sender_id <> auth.uid());

-- 3. Functions -------------------------------------------------
create or replace function public.get_or_create_property_conversation(target_property uuid, target_seller uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  buyer uuid := auth.uid();
  conversation_id uuid;
  actual_seller uuid;
begin
  if buyer is null then raise exception 'authentication required'; end if;
  select owner_id into actual_seller from properties where id = target_property and status = 'published';
  if actual_seller is null then raise exception 'property is unavailable'; end if;
  if target_seller <> actual_seller then raise exception 'invalid seller'; end if;
  if buyer = actual_seller then raise exception 'cannot message your own listing'; end if;
  select c.id into conversation_id
    from conversations c
    join conversation_members b on b.conversation_id = c.id and b.user_id = buyer
    join conversation_members s on s.conversation_id = c.id and s.user_id = actual_seller
    where c.property_id = target_property::text
    limit 1;
  if conversation_id is null then
    insert into conversations (property_id) values (target_property::text) returning id into conversation_id;
    insert into conversation_members (conversation_id, user_id) values (conversation_id, buyer), (conversation_id, actual_seller);
  end if;
  return conversation_id;
end;
$$;

revoke all on function public.get_or_create_property_conversation(uuid, uuid) from public;
grant execute on function public.get_or_create_property_conversation(uuid, uuid) to authenticated;

create or replace function public.mark_conversation_read(target_conversation uuid)
returns void language sql security invoker set search_path = public as $$
  update messages set read_at = coalesce(read_at, now())
    where conversation_id = target_conversation and sender_id <> auth.uid();
  update conversation_members set last_read_at = now()
    where conversation_id = target_conversation and user_id = auth.uid();
$$;

-- 4. Profiles — let conversation members read each other ------
drop policy if exists "conversation members read profiles" on public.profiles;
create policy "conversation members read profiles" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm1
      join public.conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
      where cm1.user_id = auth.uid() and cm2.user_id = profiles.user_id
    )
  );

-- 5. Storage for message images ------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-images', 'message-images', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own message images" on storage.objects;
create policy "users upload own message images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'message-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "conversation users read message images" on storage.objects;
create policy "conversation users read message images" on storage.objects
  for select to authenticated
  using (bucket_id = 'message-images');

-- 6. Realtime --------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
