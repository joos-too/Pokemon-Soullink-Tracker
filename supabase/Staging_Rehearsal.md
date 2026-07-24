# Hosted staging rehearsal

This runbook prepares a full Firebase-to-Supabase rehearsal on an isolated,
self-hosted staging stack. Staging must have its own Compose project, secrets,
PostgreSQL volume, Storage volume, domain names, SMTP test configuration, and
frontend deployment. Sharing only the physical server is acceptable; sharing
production containers, networks with published database ports, or volumes is
not.

## 1. Values that require an operator decision

Record these before provisioning:

- Staging Supabase hostname (for example `staging-supabase.example.com`).
- Staging frontend hostname (for example `staging-soullink.example.com`).
- Separate server directory and Docker Compose project name.
- Non-conflicting loopback ports for Kong and PostgreSQL/Supavisor.
- SMTP sink/test account and the people allowed to receive staging mail.
- Exact, tested command used to destroy and recreate only the staging volumes.

Do not point either hostname at the production Supabase or application virtual
host. Use new JWT, anon, service-role, database, dashboard, encryption, and SMTP
secrets; copying production secrets defeats isolation.

## 2. Provision the separate stack

Install a second self-hosted Supabase stack using the same pinned release as
production. Give it a distinct Compose project name and directory. Bind Kong
and the database/pooler only to unused loopback ports; Nginx provides public
HTTPS. Apply the same Nginx WebSocket settings documented in
[`Supabase_Setup.md`](Supabase_Setup.md).

Configure the staging stack with its own values:

```dotenv
SUPABASE_PUBLIC_URL=https://staging-supabase.example.com
API_EXTERNAL_URL=https://staging-supabase.example.com/auth/v1
SITE_URL=https://staging-soullink.example.com
GOTRUE_PASSWORD_MIN_LENGTH=8
```

Add the exact staging reset URL to the Auth redirect allowlist. Configure SMTP
so staging cannot mail arbitrary production users during early rehearsals (use
a sink or provider sandbox first). Enable Logs & Analytics if the production
stack will use them, because the rehearsal should include their resource cost.

Create a persistent safety marker once on the staging database and reconnect:

```sql
alter database postgres set app.environment = 'staging';
```

The committed preflight refuses to run without this marker or when either URL
matches the documented production host.

## 3. Connect without publishing PostgreSQL

Keep the staging database bound to localhost on the server. From the migration
workstation, create an SSH tunnel (adjust ports and user):

```powershell
ssh -N -L 55432:127.0.0.1:5433 your-user@your-server
```

In a second PowerShell window, set the variables listed in
[`staging.env.example`](staging.env.example). Never save real values in the
repository or shell history. Then run the read-only checks:

```powershell
npm run supabase:staging:preflight
```

Immediately after a verified clean staging reset, require empty application
tables:

```powershell
npm run supabase:staging:preflight -- --expect-empty
```

This checks HTTPS Auth and REST through Nginx, validates the service-role claim,
connects through PostgreSQL, verifies the database marker, reports row counts,
and scans an existing `dist/` for the exact service-role secret.

## 4. Apply schema without seeds

Run the dry run and inspect every statement before applying migrations. The
database URL is supplied from the current shell variable:

```powershell
npx supabase db push --db-url $env:SUPABASE_MIGRATION_STAGING_DB_URL --dry-run
npx supabase db push --db-url $env:SUPABASE_MIGRATION_STAGING_DB_URL
```

Never add `--include-seed`: `supabase/seed.sql` contains local-only accounts and
trackers. Run the pgTAP suite locally against the identical migrations; do not
run data-mutating fixture tests against hosted staging.

## 5. Rehearse the imports

Copy a recent immutable Firebase Auth export, RTDB export, and the generated UID
mapping into ignored `database-exports/`. Record their SHA-256 checksums. Follow
[`../scripts/firebase-migration/README.md`](../scripts/firebase-migration/README.md)
in this order:

1. Run the Auth dry run and inspect the UID map.
2. Import Auth into staging.
3. Verify at least one known password and one recovery email through Nginx.
4. Run the RTDB dry run and require zero quarantine issues.
5. Review counts, warnings, owner resolution, tracker mappings, and hashes.
6. Run the transactional RTDB import.
7. Run `npm run supabase:staging:preflight` again and archive its counts.
8. Repeat the identical RTDB import; it must complete without duplicates.

Do not use real user recovery or invitation emails until the SMTP routing has
been manually verified.

## 6. Deploy and test the staging frontend

Build with only the three browser-safe values shown in
`staging.env.example`. Deploy to the separate frontend hostname, then verify:

- Migrated-password login, logout, session restoration, and recovery.
- Tracker list, metadata, state persistence, deletion/leave redirects, and old
  Firebase URL not-found behavior.
- Owner/editor/guest/unrelated/anonymous permissions and owner-only emails.
- Public tracker access and owner-only public visibility changes.
- Custom rulesets and user preferences, including `multiLocaleSearch`.
- `nicknamesEnabled` for both explicit and legacy/defaulted trackers.
- Realtime propagation between two devices and after reconnect.
- Revision-conflict UI without silent overwrite.
- Nginx WebSocket upgrades, Auth/REST logs, disk growth, and backup success.

Run `npm run build`, unit tests, database tests, migrated-data integration tests,
and Playwright locally for the exact commit deployed to staging.

## 7. Reproducibility and evidence

Record start/end times, export/import/validation duration, source and target
counts, state hashes, warnings, disk usage before/after, commit SHA, Supabase
release, commands, manual fixes, and screenshots/log references. Keep reports
outside Git because they contain identifiers.

After the first successful rehearsal, use the pre-recorded staging-only reset
procedure, verify `--expect-empty`, and repeat from the same inputs. Production
cutover is not approved until both runs match and the rollback boundary in
[`Supabase_Migration.md`](Supabase_Migration.md) is explicitly accepted.

## 8. Secret cleanup

Remove every migration secret from the operator shell after the rehearsal:

```powershell
Remove-Item Env:SUPABASE_MIGRATION_STAGING_URL
Remove-Item Env:SUPABASE_MIGRATION_STAGING_APP_URL
Remove-Item Env:SUPABASE_MIGRATION_STAGING_SERVICE_ROLE_KEY
Remove-Item Env:SUPABASE_MIGRATION_STAGING_DB_URL
Remove-Item Env:FIREBASE_SCRYPT_SIGNER_KEY
Remove-Item Env:FIREBASE_SCRYPT_SALT_SEPARATOR
Remove-Item Env:FIREBASE_SCRYPT_ROUNDS
Remove-Item Env:FIREBASE_SCRYPT_MEM_COST
```
