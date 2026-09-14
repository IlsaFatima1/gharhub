-- Admin platform: featured listings, admin-wide read policies, and
-- security-definer helpers that give operators read access to auth.users
-- and cross-user aggregates that browser RLS intentionally hides.

-- Featured listings (admin-curated spotlight on Discover).
alter table public.properties add column if not exists featured boolean not null default false;
create index if not exists properties_featured_idx on public.properties(featured, status, created_at desc) where featured and status='published';

-- Admins may read across every user-scoped table. These are additive
-- policies evaluated alongside the existing self-scoped ones.
create policy "admins read all ai usage" on public.ai_usage for select to authenticated using(public.is_admin());
create policy "admins read all favorites" on public.favorites for select to authenticated using(public.is_admin());
create policy "admins read all notifications" on public.notifications for select to authenticated using(public.is_admin());

-- Operator directory: every account with live activity counts. auth.users is
-- not exposed through PostgREST, so this helper is security definer and only
-- answers callers whose request JWT carries the admin claim.
create or replace function public.admin_users()
returns table(id uuid, email text, full_name text, created_at timestamptz, is_admin boolean, property_count bigint, published_count bigint, favorites_count bigint, ai_calls bigint)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode='42501';
  end if;
  return query
    select u.id, u.email::text, (u.raw_user_meta_data->>'full_name')::text,
           u.created_at, coalesce((u.raw_app_meta_data->>'role')='admin',false),
           (select count(*) from public.properties p where p.owner_id=u.id),
           (select count(*) from public.properties p where p.owner_id=u.id and p.status='published'),
           (select count(*) from public.favorites f where f.user_id=u.id),
           (select count(*) from public.ai_usage a where a.user_id=u.id)
    from auth.users u
    order by u.created_at desc;
end;$$;

-- Marketplace health snapshot for the overview screen.
create or replace function public.admin_stats()
returns table(total_users bigint,total_properties bigint,published_properties bigint,draft_properties bigint,archived_properties bigint,sold_properties bigint,rented_properties bigint,featured_properties bigint,open_reports bigint,total_reports bigint,total_conversations bigint,total_messages bigint,total_favorites bigint,total_ai_calls bigint)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode='42501';
  end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from public.properties),
    (select count(*) from public.properties where status='published'),
    (select count(*) from public.properties where status='draft'),
    (select count(*) from public.properties where status='archived'),
    (select count(*) from public.properties where status='sold'),
    (select count(*) from public.properties where status='rented'),
    (select count(*) from public.properties where featured and status='published'),
    (select count(*) from public.property_reports where status='open'),
    (select count(*) from public.property_reports),
    (select count(*) from public.conversations),
    (select count(*) from public.messages),
    (select count(*) from public.favorites),
    (select count(*) from public.ai_usage);
end;$$;

-- Feature or unfeature a listing, writing an immutable audit entry.
create or replace function public.admin_toggle_featured(target_property uuid,target_featured boolean)
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare before_row jsonb;after_row jsonb;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode='42501';
  end if;
  select to_jsonb(p) into before_row from public.properties p where id=target_property;
  if before_row is null then raise exception 'property not found'; end if;
  update public.properties set featured=target_featured where id=target_property returning to_jsonb(properties.*) into after_row;
  insert into public.admin_audit_logs(admin_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),'toggle_featured','property',target_property::text,before_row,after_row);
  return target_featured;
end;$$;

revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
revoke all on function public.admin_toggle_featured(uuid,boolean) from public, anon;
grant execute on function public.admin_toggle_featured(uuid,boolean) to authenticated;
