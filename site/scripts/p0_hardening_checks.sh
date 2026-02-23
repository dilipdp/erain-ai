#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running P0 hardening checks in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_hardening_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_hardening_build.log
  fail "astro build"
fi

required_middleware_markers=(
  "Content-Security-Policy"
  "Strict-Transport-Security"
  "Referrer-Policy"
  "X-Frame-Options"
  "X-Content-Type-Options"
  "Permissions-Policy"
  "Cross-Origin-Opener-Policy"
  "Cross-Origin-Resource-Policy"
)

for marker in "${required_middleware_markers[@]}"; do
  if rg -n "$marker" src/middleware.ts >/dev/null; then
    pass "middleware marker present: $marker"
  else
    fail "missing middleware marker: $marker"
  fi
done

PORT=4377
SERVER_LOG="/tmp/erain_hardening_server.log"
HEADER_FILE="/tmp/erain_hardening_headers.txt"
BODY_FILE="/tmp/erain_hardening_body.html"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

PORT="$PORT" HOST=127.0.0.1 node dist/server/entry.mjs >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in {1..25}; do
  if curl -sS -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then
    break
  fi
  sleep 0.2
done

status="$(curl -sS -o "$BODY_FILE" -D "$HEADER_FILE" -w "%{http_code}" "http://127.0.0.1:${PORT}/")"
[[ "$status" == "200" ]] && pass "home route status 200" || fail "home route status $status"

required_headers=(
  "content-security-policy:"
  "referrer-policy:"
  "x-frame-options:"
  "x-content-type-options:"
  "permissions-policy:"
  "cross-origin-opener-policy:"
  "cross-origin-resource-policy:"
)

for header in "${required_headers[@]}"; do
  if rg -n "^${header}" -i "$HEADER_FILE" >/dev/null; then
    pass "response header present: ${header%:}"
  else
    printf "Header dump:\n"
    cat "$HEADER_FILE"
    fail "missing response header: ${header%:}"
  fi
done

routes=(
  "/privacy"
  "/terms"
  "/security"
  "/dpa"
  "/cookie-policy"
  "/legal"
  "/pricing"
  "/results"
)

for route in "${routes[@]}"; do
  code="$(curl -sS -o /tmp/erain_hardening_route.html -w "%{http_code}" "http://127.0.0.1:${PORT}${route}")"
  [[ "$code" == "200" ]] && pass "route ${route} status 200" || fail "route ${route} status ${code}"
done

pass "P0 hardening checks complete"
