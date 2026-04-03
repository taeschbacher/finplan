#!/bin/sh
set -eu

if [ ! -d node_modules/@angular/core ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

exec npm run start
