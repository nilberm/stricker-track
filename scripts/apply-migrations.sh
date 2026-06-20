#!/bin/sh
set -eu

PSQL_URL="${DATABASE_URL%%\?*}"

psql "$PSQL_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS "_sticker_track_migrations" (
  "name" TEXT PRIMARY KEY,
  "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL

for directory in packages/database/prisma/migrations/*; do
  [ -d "$directory" ] || continue
  name="$(basename "$directory")"
  applied="$(
    psql "$PSQL_URL" -t -A -v ON_ERROR_STOP=1 \
      -c "SELECT COUNT(*) FROM \"_sticker_track_migrations\" WHERE \"name\" = '$name';"
  )"
  if [ "$applied" = "0" ]; then
    echo "Applying migration $name..."
    {
      echo "BEGIN;"
      cat "$directory/migration.sql"
      printf "\nINSERT INTO \"_sticker_track_migrations\" (\"name\") VALUES ('%s');\n" "$name"
      echo "COMMIT;"
    } | psql "$PSQL_URL" -v ON_ERROR_STOP=1
  fi
done
