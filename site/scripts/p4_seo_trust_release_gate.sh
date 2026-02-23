#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running SEO/trust release gate in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_p4_seo_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_p4_seo_build.log
  fail "astro build"
fi

if node scripts/seo_trust_release_gate.mjs; then
  pass "seo/trust release gate"
else
  fail "seo/trust release gate"
fi

pass "SEO/trust release gate complete"
