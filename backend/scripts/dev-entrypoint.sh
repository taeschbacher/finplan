#!/bin/sh
set -eu

if [ ! -d node_modules/@nestjs/common ]; then
  echo "Installing backend dependencies..."
  npm install
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Waiting for database and applying migrations..."
until npx prisma migrate deploy; do
  echo "Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

exec npm run start:dev
