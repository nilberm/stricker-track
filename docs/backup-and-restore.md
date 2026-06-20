# Backup and restore

## Policy

Create an encrypted daily PostgreSQL backup, retain at least seven daily and four weekly restore points, and take an additional backup before critical migrations. Restrict storage access, use TLS in transit, and use a database role with only the permissions required by the application. Managed PostgreSQL should enable point-in-time recovery when the chosen plan supports it.

Backups are not considered valid until restored and checked in a separate database. Test restoration on a schedule and record the date, duration, backup identifier, and result.

## Logical backup

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" --file sticker-track.dump
pg_restore --list sticker-track.dump
```

Store the file outside the application server after encryption. Do not place it in the repository or a public bucket.

## Safe restore test

Create an empty isolated database, never the live database, then run:

```bash
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$RESTORE_TEST_DATABASE_URL" sticker-track.dump
```

Validate migration history, table counts, a sample of users and collections, and API readiness against the isolated database. Delete the test database only after recording the result.

## Incident restore

Stop writes, preserve the failed database, choose the last verified restore point, restore into a new database, run read-only checks, update the API secret reference to the restored database, and then resume traffic. Restoration is intentionally never automated by project scripts because it is destructive.
