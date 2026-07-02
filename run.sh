#!/usr/bin/env bash
# Production build + run: Next.js (standalone) frontend + Express backend under pm2.
# Run from repo root. Reads .env for NEXT_PUBLIC_* (baked at build) and backend config.
set -euo pipefail
cd "$(dirname "$0")"

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
HOSTNAME_BIND="${HOSTNAME_BIND:-0.0.0.0}"

echo "==> Building frontend (NEXT_PUBLIC_* baked from .env)"
npm run build

echo "==> Copying static assets into standalone"
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public || true

echo "==> (Re)starting processes under pm2"
pm2 delete ssh-backend ssh-frontend >/dev/null 2>&1 || true

# backend: reads .env from cwd (repo root)
pm2 start backend/src/index.js --name ssh-backend

# frontend: standalone server; PORT + HOSTNAME are runtime env
PORT="$FRONTEND_PORT" HOSTNAME="$HOSTNAME_BIND" \
  pm2 start .next/standalone/server.js --name ssh-frontend

pm2 save

echo "==> Up. frontend :$FRONTEND_PORT  backend :3001"
pm2 status
