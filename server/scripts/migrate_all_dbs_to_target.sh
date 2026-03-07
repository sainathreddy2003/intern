#!/usr/bin/env bash
set -euo pipefail

# Copies all non-system databases from SOURCE_MONGODB_URI to TARGET_MONGODB_URI.
# Requires: mongosh, mongodump, mongorestore

if ! command -v mongosh >/dev/null 2>&1; then
  echo "Error: mongosh not found. Install MongoDB Database Tools + Shell first."
  exit 1
fi

if ! command -v mongodump >/dev/null 2>&1 || ! command -v mongorestore >/dev/null 2>&1; then
  echo "Error: mongodump/mongorestore not found. Install MongoDB Database Tools first."
  exit 1
fi

SOURCE_URI="${SOURCE_MONGODB_URI:-mongodb://127.0.0.1:27017}"
TARGET_URI="${TARGET_MONGODB_URI:-${MONGODB_URI:-}}"

if [[ -z "${TARGET_URI}" ]]; then
  echo "Error: TARGET_MONGODB_URI (or MONGODB_URI) is required."
  exit 1
fi

echo "Source: ${SOURCE_URI}"
echo "Target: ${TARGET_URI}"

DBS=$(mongosh "${SOURCE_URI}" --quiet --eval 'db.adminCommand({ listDatabases: 1 }).databases.map(d => d.name).filter(n => !["admin","config","local"].includes(n)).join("\n")')

if [[ -z "${DBS}" ]]; then
  echo "No user databases found on source."
  exit 0
fi

while IFS= read -r DB; do
  [[ -z "${DB}" ]] && continue
  echo "Migrating database: ${DB}"

  mongodump \
    --uri="${SOURCE_URI}" \
    --db="${DB}" \
    --archive \
  | mongorestore \
      --uri="${TARGET_URI}" \
      --nsFrom="${DB}.*" \
      --nsTo="${DB}.*" \
      --archive \
      --drop

done <<< "${DBS}"

echo "Migration complete."
