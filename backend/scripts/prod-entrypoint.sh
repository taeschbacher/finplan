#!/bin/sh
set -eu

echo "Waiting for database and applying Prisma migrations..."
until npx prisma migrate deploy; do
  echo "Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

exec node dist/main.js
