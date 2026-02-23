#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

printf "Running launch QA checklist in %s\n" "$SITE_ROOT"

if npm run build >/tmp/erain_site_build.log 2>&1; then
  pass "astro build"
else
  cat /tmp/erain_site_build.log
  fail "astro build"
fi

required_events=(
  "site_cta_click"
  "assessment_submitted"
  "assessment_submit_failed"
  "contact_submitted"
  "contact_submit_failed"
  "client_login_submitted"
  "client_login_failed"
)

for event in "${required_events[@]}"; do
  if rg -n "$event" src >/dev/null; then
    pass "event mapped: $event"
  else
    fail "missing event mapping: $event"
  fi
done

if rg -n "data-track=" src/pages >/dev/null; then
  pass "data-track attributes present on page CTAs"
else
  fail "missing data-track attributes"
fi

if rg -n "execution-lens-hero\\.svg|erain-prism-hero\\.svg" src public >/dev/null; then
  fail "legacy hero asset reference found"
else
  pass "no legacy hero asset references"
fi

if [ -s "public/sample-report.pdf" ]; then
  pass "sample-report.pdf exists and is non-empty"
else
  fail "sample-report.pdf missing or empty"
fi

if [ -f "src/pages/results.astro" ]; then
  pass "results route exists"
else
  fail "missing results route"
fi

if rg -n 'href="/results"' src/layouts/BaseLayout.astro >/dev/null; then
  pass "navigation points to /results"
else
  fail "navigation does not include /results"
fi

printf "Launch QA checklist complete.\n"
