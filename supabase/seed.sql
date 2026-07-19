-- Local development fixtures only. Never apply this file to staging or production.
begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'test@example.com',
    extensions.crypt('testpassword123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 12:00:00+00', now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'editor@example.com',
    extensions.crypt('testpassword123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 12:00:00+00', now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'guest@example.com',
    extensions.crypt('testpassword123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 12:00:00+00', now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'unrelated@example.com',
    extensions.crypt('testpassword123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 12:00:00+00', now(), '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  ('20000000-0000-0000-0000-00000000000' || seed.ordinal)::uuid,
  seed.user_id,
  seed.user_id::text,
  jsonb_build_object('sub', seed.user_id::text, 'email', seed.email),
  'email',
  now(),
  now(),
  now()
from (
  values
    (1, '10000000-0000-0000-0000-000000000001'::uuid, 'test@example.com'),
    (2, '10000000-0000-0000-0000-000000000002'::uuid, 'editor@example.com'),
    (3, '10000000-0000-0000-0000-000000000003'::uuid, 'guest@example.com'),
    (4, '10000000-0000-0000-0000-000000000004'::uuid, 'unrelated@example.com')
) as seed(ordinal, user_id, email)
on conflict (provider_id, provider) do nothing;

update public.profiles
set
  multi_locale_search = id in (
    '10000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid
  ),
  use_generation_sprites = id = '10000000-0000-0000-0000-000000000001'::uuid,
  use_sprites_in_team_table = id = '10000000-0000-0000-0000-000000000001'::uuid,
  wiki_id = case
    when id = '10000000-0000-0000-0000-000000000001'::uuid then 'pokewiki'
    else null
  end;

insert into public.trackers (
  id,
  title,
  player_names,
  created_by,
  created_at,
  game_version_id,
  is_public,
  all_pokemon_and_items,
  ruleset_id
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Pokémon Blue Soullink',
    array['Player 1', 'Player 2'],
    '10000000-0000-0000-0000-000000000001',
    '2026-02-27 12:00:00+00',
    'gen1_rb',
    true,
    false,
    'standard'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'Pokémon Platinum Soullink',
    array['Player 1', 'Player 2'],
    '10000000-0000-0000-0000-000000000001',
    '2026-09-13 12:00:00+00',
    'gen4_pt',
    false,
    false,
    'standard'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Pokémon Black Soullink',
    array['Player 1', 'Player 2'],
    '10000000-0000-0000-0000-000000000001',
    '2026-06-13 12:00:00+00',
    'gen5_bw',
    false,
    true,
    'standard'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Pokémon Alpha Sapphire Soullink',
    array['Player 1', 'Player 2'],
    '10000000-0000-0000-0000-000000000001',
    '2025-11-21 12:00:00+00',
    'gen6_oras',
    false,
    false,
    'standard'
  );

insert into public.tracker_members (tracker_id, user_id, role, settings)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', '{"rivalPreferences":{"blue":"male"}}'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'editor', '{}'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'guest', '{}'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner', '{}'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'owner', '{}'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'owner', '{}');

with base_state as (
  select jsonb_build_object(
    'team', jsonb_build_array(
      jsonb_build_object(
        'id', 1,
        'locationSlug', 'route-1',
        'members', jsonb_build_array(
          jsonb_build_object('id', 16, 'nickname', 'Gust'),
          jsonb_build_object('id', 19, 'nickname', 'Ratty')
        )
      )
    ),
    'box', '[]'::jsonb,
    'graveyard', '[]'::jsonb,
    'rules', jsonb_build_array('Only the first encounter per area may be caught.'),
    'levelCaps', jsonb_build_array(
      jsonb_build_object('id', 1, 'level', 14, 'done', true),
      jsonb_build_object('id', 2, 'level', 21, 'done', false)
    ),
    'rivalCaps', jsonb_build_array(
      jsonb_build_object('id', 1, 'level', 9, 'done', true, 'revealed', true)
    ),
    'stats', jsonb_build_object(
      'runs', 1,
      'best', 1,
      'top4Items', jsonb_build_array(0, 0),
      'deaths', jsonb_build_array(0, 0),
      'sumDeaths', jsonb_build_array(0, 0),
      'legendaryEncounters', 0
    ),
    'legendaryTrackerEnabled', true,
    'rivalCensorMode', 'on',
    'hardcoreModeEnabled', false,
    'nicknamesEnabled', true,
    'infiniteFossilsEnabled', false,
    'megaStoneSpriteStyle', 'item',
    'fossils', jsonb_build_array('[]'::jsonb, '[]'::jsonb),
    'items', jsonb_build_array('[]'::jsonb, '[]'::jsonb),
    'runStartedAt', 1767268800000
  ) as state
)
insert into public.tracker_states (
  tracker_id,
  state,
  schema_version,
  revision,
  updated_by
)
select tracker_id, state, 1, revision, '10000000-0000-0000-0000-000000000001'
from (
  select
    '30000000-0000-0000-0000-000000000001'::uuid as tracker_id,
    state || jsonb_build_object(
      'nicknamesEnabled', false,
      'stats', (state -> 'stats') || jsonb_build_object('runs', 42, 'deaths', jsonb_build_array(1, 1))
    ) as state,
    8::bigint as revision
  from base_state
  union all
  select
    '30000000-0000-0000-0000-000000000002',
    state || jsonb_build_object(
      'stats', (state -> 'stats') || jsonb_build_object('runs', 27, 'deaths', jsonb_build_array(0, 2))
    ),
    5
  from base_state
  union all
  select
    '30000000-0000-0000-0000-000000000003',
    state || jsonb_build_object(
      'stats', (state -> 'stats') || jsonb_build_object('runs', 17, 'deaths', jsonb_build_array(2, 3))
    ),
    11
  from base_state
  union all
  select
    '30000000-0000-0000-0000-000000000004',
    state || jsonb_build_object(
      'stats', (state -> 'stats') || jsonb_build_object('runs', 4, 'deaths', jsonb_build_array(1, 1))
    ),
    3
  from base_state
) as tracker_seed;

insert into public.rulesets (
  owner_id,
  id,
  name,
  description,
  rules,
  tags
)
values (
  '10000000-0000-0000-0000-000000000001',
  'local-custom-rules',
  'Local Custom Rules',
  'Deterministic custom ruleset for local development.',
  array['Only the first encounter per area may be caught.', 'Fainted Pokémon are lost.'],
  array['local', 'test']
);

commit;
