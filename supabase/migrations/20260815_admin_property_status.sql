-- Audited admin mutation of a property's listing status. Mirrors the
-- admin_toggle_featured pattern: security definer, guarded by is_admin(),
-- and every change lands in the immutable audit log.
create or replace function public.admin_set_property_status(target_property uuid,next_status text)
returns text language plpgsql security definer set search_path=public,auth as $$
declare before_row jsonb;after_row jsonb;
begin
  if not public.is_admin() then
    raise exception 'administrator access required' using errcode='42501';
  end if;
  if next_status not in('draft','published','archived','sold','rented') then
    raise exception 'invalid property status';
  end if;
  select to_jsonb(p) into before_row from public.properties p where id=target_property for update;
  if before_row is null then raise exception 'property not found'; end if;
  update public.properties set status=next_status where id=target_property returning to_jsonb(properties.*) into after_row;
  insert into public.admin_audit_logs(admin_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),'set_property_status','property',target_property::text,before_row,after_row);
  return next_status;
end;$$;
revoke all on function public.admin_set_property_status(uuid,text) from public, anon;
grant execute on function public.admin_set_property_status(uuid,text) to authenticated;
