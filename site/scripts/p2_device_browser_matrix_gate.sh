#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running device/browser matrix gate in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_p2_matrix_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_p2_matrix_build.log
  fail "astro build"
fi

if node scripts/device_browser_matrix_gate.mjs; then
  pass "device/browser matrix gate"
else
  fail "device/browser matrix gate"
fi

pass "Device/browser matrix gate complete"
