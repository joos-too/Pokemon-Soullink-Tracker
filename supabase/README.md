# Supabase development

This directory is the version-controlled source of truth for the Supabase database. Do not make schema changes directly in Studio.

## Prerequisites

- [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) or another Docker-compatible runtime is installed and running.
- Node.js dependencies have been installed with `npm install`.

### Docker Desktop on Windows

1. Download and install [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Start Docker Desktop and wait until the Docker engine is running.
3. To enable local Supabase Logs & Analytics, open **Docker Desktop → Settings → General** and enable **Expose daemon on `tcp://localhost:2375` without TLS**.
4. Apply the settings and restart Docker Desktop.
5. Verify Docker and the analytics endpoint from PowerShell:

```powershell
docker version
Test-NetConnection localhost -Port 2375
Invoke-RestMethod http://localhost:2375/version
```

Supabase local analytics uses this endpoint on Windows so its Vector container can collect Docker logs. See the [Supabase Windows setup guidance](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows#running-supabase-locally).

Port 2375 exposes an unauthenticated Docker API with control over Docker and potentially the host. Enable it only on a trusted development machine, keep it blocked from external networks with Windows Firewall, and never expose it through a router, VPN, or public interface. Disable the setting when local analytics is not needed. See the [Docker Desktop security warning](https://docs.docker.com/desktop/settings-and-maintenance/settings/).

## Local workflow

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:types
```

`supabase:reset` applies every migration and then `seed.sql`. Supabase Studio is available at `http://127.0.0.1:54323`, and local Auth email is available through Mailpit at `http://127.0.0.1:54324`.

### Initial migration layout

The initial database is split into ordered migrations with explicit dependencies:

| Migration                                 | Responsibility                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `20260719130000_core_schema.sql`          | Extensions, schemas, enum, tables, constraints, and indexes                     |
| `20260719130100_helpers_and_triggers.sql` | Auth profile creation, authorization helpers, summaries, and invariant triggers |
| `20260719130200_rls_and_grants.sql`       | Row Level Security policies and client privileges                               |
| `20260719130300_tracker_rpcs.sql`         | Transactional tracker and membership functions                                  |
| `20260719130400_realtime.sql`             | Realtime publication registration                                               |

Do not reorder these files: each migration assumes the preceding migrations have completed.

The local seed accounts all use password `testpassword123`:

| Account                 | Intended role                      |
| ----------------------- | ---------------------------------- |
| `test@example.com`      | Tracker owner                      |
| `editor@example.com`    | Editor on the public Gen 1 tracker |
| `guest@example.com`     | Guest on the public Gen 1 tracker  |
| `unrelated@example.com` | No memberships                     |

The four tracker IDs and all user IDs are fixed UUIDs so database and frontend tests remain deterministic. Seeds are local fixtures only and must never be included in a staging or production database push.

## Creating and deploying migrations

Create a migration with a descriptive name:

```bash
npm run supabase:migration:new -- add_feature_name
```

For a self-hosted database, pass its encoded connection URL at invocation time. Always inspect a dry run first:

```bash
npm run supabase:db:push:dry-run -- --db-url "<database-url>"
npm run supabase:db:push -- --db-url "<database-url>"
```

Never put database URLs, service-role keys, Firebase exports, or migration reports containing user data in this repository. Do not add `--include-seed` when pushing to staging or production.
