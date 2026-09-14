-- Role request notification trigger
-- Sends a notification to the user when their role request is approved or rejected

create or replace function public.notify_role_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('approved','rejected') and (old.status is null or old.status = 'pending') then
    insert into public.notifications (user_id, type, title, body, action_url, metadata)
    values (
      new.user_id,
      'role_request',
      'Role request ' || new.status,
      'Your request to switch from ' || new.from_role || ' to ' || new.requested_role ||
        ' has been ' || new.status ||
        case when new.admin_notes is not null and new.admin_notes != '' 
          then ': ' || new.admin_notes 
          else '' 
        end || '.',
      '/dashboard/account',
      jsonb_build_object('role_request_id', new.id::text)
    );
  end if;
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_role_request_status_change on public.role_requests;

-- Create the trigger
create trigger on_role_request_status_change
  after update on public.role_requests
  for each row
  execute function public.notify_role_request_change();

-- Grant execute to authenticated and anon (already SECURITY DEFINER)
grant execute on function public.notify_role_request_change() to authenticated;
grant execute on function public.notify_role_request_change() to anon;

-- Add role_request column to notification_preferences if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'notification_preferences' 
    and column_name = 'role_request'
  ) then
    alter table public.notification_preferences 
      add column role_request boolean not null default true;
  end if;
end $$;
