drop function public.list_tracker_members(uuid);

create function public.list_tracker_members(p_tracker_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  role public.tracker_role,
  added_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_owner boolean;
begin
  if not private.is_tracker_reader(p_tracker_id, caller_id) then
    raise exception using errcode = '42501', message = 'tracker_read_access_required';
  end if;

  caller_is_owner := private.is_tracker_owner(p_tracker_id, caller_id);

  return query
  select
    member.user_id,
    profile.display_name,
    case when caller_is_owner then auth_user.email::text else null end,
    member.role,
    member.added_at
  from public.tracker_members as member
  join public.profiles as profile on profile.id = member.user_id
  join auth.users as auth_user on auth_user.id = member.user_id
  where member.tracker_id = p_tracker_id
  order by member.added_at;
end;
$$;

revoke all on function public.list_tracker_members(uuid) from public;
grant execute on function public.list_tracker_members(uuid) to authenticated;
