#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running launch quality gate in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_quality_gate_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_quality_gate_build.log
  fail "astro build"
fi

if node scripts/lighthouse_axe_gate.mjs; then
  pass "lighthouse + axe quality gate"
else
  fail "lighthouse + axe quality gate"
fi

pass "Launch quality gate complete"
