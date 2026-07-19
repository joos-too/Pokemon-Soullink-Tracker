alter table public.profiles
add column display_name_requires_update boolean not null default false;

update public.profiles as profile
set display_name_requires_update = true
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.firebase_uid is not null
  and profile.display_name = left(
    coalesce(
      nullif(btrim(split_part(coalesce(auth_user.email, ''), '@', 1)), ''),
      'Trainer'
    ),
    50
  );

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  requested_display_name text;
  resolved_display_name text;
begin
  requested_display_name := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')),
    ''
  );
  resolved_display_name := left(
    coalesce(
      requested_display_name,
      nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), ''),
      'Trainer'
    ),
    50
  );

  insert into public.profiles (
    id,
    display_name,
    display_name_requires_update,
    created_at,
    last_login_at
  )
  values (
    new.id,
    resolved_display_name,
    requested_display_name is null,
    coalesce(new.created_at, now()),
    coalesce(new.last_sign_in_at, new.created_at, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

grant update (display_name_requires_update) on public.profiles to authenticated;
