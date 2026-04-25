#!/bin/sh
set -eu

if [ ! -d node_modules/@angular/core ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Angular's dev server uses Vite internally. With a bind-mounted source
# directory, stale optimized dependency files can survive container restarts
# and cause browser errors such as:
#   504 (Outdated Optimize Dep)
# Clear dev caches before starting so Vite/Angular rebuild them from the
# currently installed dependencies.
echo "Clearing Angular/Vite development caches..."
rm -rf .angular/cache node_modules/.vite

exec npm run start
