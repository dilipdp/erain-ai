#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running analytics consent gate in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_p3_analytics_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_p3_analytics_build.log
  fail "astro build"
fi

if node scripts/analytics_consent_gate.mjs; then
  pass "analytics consent gate"
else
  fail "analytics consent gate"
fi

pass "Analytics consent gate complete"
