#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%$'\r'}"
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  export "$line"
done < .env

stop_dev_stack() {
  pkill -9 -f "pnpm run --parallel dev" 2>/dev/null || true
  pkill -9 -f "tsx/dist/cli" 2>/dev/null || true
  pkill -9 -f "tsx/dist/loader.mjs src/index.ts" 2>/dev/null || true
  pkill -9 -f "vite/bin/vite.js" 2>/dev/null || true
  for port in 3002 5173 5174 5175; do
    fuser -k "${port}/tcp" 2>/dev/null || true
  done
  sleep 2
}

stop_dev_stack

pnpm dev > /tmp/wall4art-e2e-dev.log 2>&1 &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
  stop_dev_stack
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -sf --max-time 2 http://localhost:3002/health >/dev/null \
    && curl -sf --max-time 2 http://localhost:5173/ >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf --max-time 5 http://localhost:3002/health >/dev/null; then
  echo "API indisponible. Journal : /tmp/wall4art-e2e-dev.log" >&2
  tail -30 /tmp/wall4art-e2e-dev.log >&2 || true
  exit 1
fi

if ! curl -sf --max-time 5 http://localhost:5173/ >/dev/null; then
  echo "Frontend indisponible sur le port 5173. Journal : /tmp/wall4art-e2e-dev.log" >&2
  tail -30 /tmp/wall4art-e2e-dev.log >&2 || true
  exit 1
fi

pnpm exec playwright test "$@"
