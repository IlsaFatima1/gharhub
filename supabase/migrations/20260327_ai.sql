-- Per-user AI quotas and auditable usage. API keys remain in Edge Function secrets.
create table if not exists public.ai_usage(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,operation text not null check(operation in('title','description','price','search','recommend','chat')),created_at timestamptz not null default now());
create index if not exists ai_usage_quota_idx on public.ai_usage(user_id,created_at desc);
alter table public.ai_usage enable row level security;
create policy "users read own ai usage" on public.ai_usage for select using(user_id=auth.uid());
create or replace function public.consume_ai_quota(operation text) returns boolean language plpgsql security definer set search_path=public as $$declare recent_count integer;begin if auth.uid() is null then return false;end if;if operation not in('title','description','price','search','recommend','chat') then return false;end if;select count(*) into recent_count from ai_usage where user_id=auth.uid() and created_at>now()-interval '1 minute';if recent_count>=20 then return false;end if;insert into ai_usage(user_id,operation) values(auth.uid(),operation);return true;end;$$;
revoke all on function public.consume_ai_quota(text) from public;grant execute on function public.consume_ai_quota(text) to authenticated;
