-- Production features: profiles, role requests, property analytics, notifications.
-- Idempotent migration — safe to re-run.

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
create table if not exists public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  marketplace_role text not null default 'buyer' check(marketplace_role in('buyer','seller')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users read own profile
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using(user_id = auth.uid());

-- Users update own profile (marketplace_role excluded — requires admin)
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using(user_id = auth.uid())
  with check(user_id = auth.uid() and marketplace_role = (select marketplace_role from public.profiles where user_id = auth.uid()));

-- Everyone can read published property owner profiles (seller info display)
drop policy if exists "public reads property owner profiles" on public.profiles;
create policy "public reads property owner profiles"
  on public.profiles for select
  using(
    exists(
      select 1 from public.properties p
      where p.owner_id = profiles.user_id
        and p.status = 'published'
    )
  );

-- updated_at trigger
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(user_id, full_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. ROLE REQUESTS TABLE
-- ============================================================
create table if not exists public.role_requests(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_role text not null check(from_role in('buyer','seller')),
  requested_role text not null check(requested_role in('buyer','seller')),
  status text not null default 'pending' check(status in('pending','approved','rejected')),
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.role_requests enable row level security;

-- Users insert own requests
drop policy if exists "users insert own role requests" on public.role_requests;
create policy "users insert own role requests"
  on public.role_requests for insert
  to authenticated
  with check(user_id = auth.uid());

-- Users read own requests
drop policy if exists "users read own role requests" on public.role_requests;
create policy "users read own role requests"
  on public.role_requests for select
  using(user_id = auth.uid());

-- Admins read all requests
drop policy if exists "admins read all role requests" on public.role_requests;
create policy "admins read all role requests"
  on public.role_requests for select
  to authenticated
  using(public.is_admin());

-- Admins update all requests
drop policy if exists "admins update role requests" on public.role_requests;
create policy "admins update role requests"
  on public.role_requests for update
  to authenticated
  using(public.is_admin())
  with check(public.is_admin());

-- ============================================================
-- 4. PROPERTY VIEWS TABLE
-- ============================================================
create table if not exists public.property_views(
  id bigserial primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  session_id text not null default '',
  created_at timestamptz not null default now()
);

alter table public.property_views enable row level security;

create index if not exists property_views_property_idx on public.property_views(property_id, created_at desc);

-- Property owners read views on their properties
drop policy if exists "owners read own property views" on public.property_views;
create policy "owners read own property views"
  on public.property_views for select
  using(
    exists(
      select 1 from public.properties p
      where p.id = property_views.property_id
        and p.owner_id = auth.uid()
    )
  );

-- Admins read all views
drop policy if exists "admins read all property views" on public.property_views;
create policy "admins read all property views"
  on public.property_views for select
  to authenticated
  using(public.is_admin());

-- Anyone can insert (for tracking)
drop policy if exists "anyone can record property views" on public.property_views;
create policy "anyone can record property views"
  on public.property_views for insert
  with check(true);

-- Realtime
alter publication supabase_realtime add table public.property_views;

-- ============================================================
-- 5. FIX OLD CONVERSATION_MEMBERS POLICY
-- ============================================================
drop policy if exists "members read membership" on public.conversation_members;

-- ============================================================
-- 6. RPC: record_property_view
-- ============================================================
create or replace function public.record_property_view(target_property uuid)
returns void language plpgsql security definer set search_path=public as $$
declare viewer uuid; sid text;
begin
  viewer := auth.uid();
  sid := coalesce(current_setting('request.headers', true)::json->>'x-session-id', '');
  if viewer is not null then
    if exists(select 1 from public.property_views where property_id=target_property and viewer_id=viewer and created_at > now() - interval '1 hour') then
      return;
    end if;
  elseif length(sid) > 0 then
    if exists(select 1 from public.property_views where property_id=target_property and session_id=sid and created_at > now() - interval '1 hour') then
      return;
    end if;
  end if;
  insert into public.property_views(property_id, viewer_id, session_id) values(target_property, viewer, sid);
end;$$;

grant execute on function public.record_property_view(uuid) to anon, authenticated;

-- ============================================================
-- 7. RPC: get_property_stats
-- ============================================================
create or replace function public.get_property_stats(target_property uuid)
returns table(view_count bigint, favorite_count bigint)
language plpgsql stable security definer set search_path=public as $$
begin
  return query select
    (select count(*) from public.property_views where property_id=target_property),
    (select count(*) from public.favorites where property_id=target_property);
end;$$;

grant execute on function public.get_property_stats(uuid) to authenticated;

-- ============================================================
-- 8. RPC: get_seller_stats
-- ============================================================
create or replace function public.get_seller_stats()
returns table(
  total_listings bigint,
  published_count bigint,
  draft_count bigint,
  sold_count bigint,
  rented_count bigint,
  total_views bigint,
  total_favorites bigint,
  total_inquiries bigint
)
language plpgsql stable security definer set search_path=public as $$
declare uid uuid := auth.uid();
begin
  return query select
    (select count(*) from public.properties where owner_id=uid),
    (select count(*) from public.properties where owner_id=uid and status='published'),
    (select count(*) from public.properties where owner_id=uid and status='draft'),
    (select count(*) from public.properties where owner_id=uid and status='sold'),
    (select count(*) from public.properties where owner_id=uid and status='rented'),
    (select count(*) from public.property_views pv join public.properties p on p.id=pv.property_id where p.owner_id=uid),
    (select count(*) from public.favorites f join public.properties p on p.id=f.property_id where p.owner_id=uid),
    (select count(*) from public.conversations c join public.properties p on p.id::text=c.property_id where p.owner_id=uid);
end;$$;

grant execute on function public.get_seller_stats() to authenticated;

-- ============================================================
-- 9. NOTIFICATION TRIGGER FOR PROPERTY STATUS CHANGES
-- ============================================================
create or replace function public.notify_property_status_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare owner_name text;
begin
  if old.status = new.status then return new; end if;
  select coalesce(p.full_name, u.email) into owner_name
  from public.profiles p join auth.users u on u.id=p.user_id where p.user_id=new.owner_id;

  if new.status = 'sold' then
    insert into public.notifications(user_id, type, title, body, action_url, metadata)
    values(new.owner_id, 'property_sold', 'Property marked as sold',
      'Your listing "' || new.title || '" has been marked as sold.',
      '/dashboard/properties', jsonb_build_object('property_id', new.id::text));
  elsif new.status = 'archived' then
    insert into public.notifications(user_id, type, title, body, action_url, metadata)
    values(new.owner_id, 'property_rejected', 'Property archived',
      'Your listing "' || new.title || '" has been archived.',
      '/dashboard/properties', jsonb_build_object('property_id', new.id::text));
  elsif new.status = 'published' and old.status != 'published' then
    insert into public.notifications(user_id, type, title, body, action_url, metadata)
    values(new.owner_id, 'property_approved', 'Property published',
      'Your listing "' || new.title || '" is now live on Havenly.',
      '/dashboard/properties', jsonb_build_object('property_id', new.id::text));
  end if;
  return new;
end;$$;

drop trigger if exists notify_property_status_change on public.properties;
create trigger notify_property_status_change
  after update of status on public.properties
  for each row execute function public.notify_property_status_change();
