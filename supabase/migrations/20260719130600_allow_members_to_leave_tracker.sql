create or replace function public.remove_tracker_member(
  p_tracker_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  caller_id uuid := auth.uid();
  target_role public.tracker_role;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  if caller_id <> p_user_id
    and not private.is_tracker_owner(p_tracker_id, caller_id)
  then
    raise exception using errcode = '42501', message = 'tracker_owner_required';
  end if;

  select role into target_role
  from public.tracker_members
  where tracker_id = p_tracker_id and user_id = p_user_id;

  if target_role is null then
    raise exception using errcode = 'P0002', message = 'tracker_member_not_found';
  end if;

  if target_role = 'owner' then
    raise exception using errcode = '22023', message = 'tracker_owner_cannot_be_removed';
  end if;

  delete from public.tracker_members
  where tracker_id = p_tracker_id and user_id = p_user_id;
end;
$$;

revoke all on function public.remove_tracker_member(uuid, uuid) from public;
grant execute on function public.remove_tracker_member(uuid, uuid) to authenticated;
