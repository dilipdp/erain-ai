#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

BASE_URL="${PRODUCTION_BASE_URL:-}"
RUN_STEP5=1
SKIP_TAGS=1
ALLOW_INSECURE=0
PROD_REPORT_PATH="${P6_PRODUCTION_SMOKE_REPORT:-/tmp/erain_production_smoke_report.json}"
GUARDRAIL_REPORT_PATH="${P6_LAUNCH_GUARDRAIL_REPORT:-/tmp/erain_launch_guardrail_report.json}"

usage() {
  cat <<'EOF'
Usage: bash scripts/p6_launch_guardrail.sh --url <https://domain> [options]

Runs Step 5 release candidate checks + Step 6 production smoke checks and prints GO/NO-GO.

Options:
  --url <url>            Base URL for production smoke checks (required unless PRODUCTION_BASE_URL is set).
  --skip-step5           Run only Step 6 production smoke checks.
  --create-tags          Run Step 5 without --skip-tags.
  --allow-insecure       Allow http:// URL for non-production smoke checks.
  --prod-report <path>   Production smoke report path (default: /tmp/erain_production_smoke_report.json).
  --report <path>        Combined guardrail report path (default: /tmp/erain_launch_guardrail_report.json).
  --help                 Show help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --skip-step5)
      RUN_STEP5=0
      shift
      ;;
    --create-tags)
      SKIP_TAGS=0
      shift
      ;;
    --allow-insecure)
      ALLOW_INSECURE=1
      shift
      ;;
    --prod-report)
      PROD_REPORT_PATH="$2"
      shift 2
      ;;
    --report)
      GUARDRAIL_REPORT_PATH="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf "Unknown option: %s\n" "$1" >&2
      usage
      exit 1
      ;;
  esac
done

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

[[ -n "$BASE_URL" ]] || fail "Missing base URL. Use --url <https://domain>."

step5_status="skipped"
step6_status="fail"
overall_status="fail"

if [[ "$RUN_STEP5" -eq 1 ]]; then
  if [[ "$SKIP_TAGS" -eq 1 ]]; then
    if bash scripts/p5_release_candidate.sh --skip-tags; then
      step5_status="pass"
      pass "step5 release candidate gate"
    else
      step5_status="fail"
      printf "FAIL: step5 release candidate gate\n" >&2
    fi
  else
    if bash scripts/p5_release_candidate.sh; then
      step5_status="pass"
      pass "step5 release candidate gate"
    else
      step5_status="fail"
      printf "FAIL: step5 release candidate gate\n" >&2
    fi
  fi
fi

step6_args=(--url "$BASE_URL" --report "$PROD_REPORT_PATH")
if [[ "$ALLOW_INSECURE" -eq 1 ]]; then
  step6_args+=(--allow-insecure)
fi

if bash scripts/p6_production_smoke_gate.sh "${step6_args[@]}"; then
  step6_status="pass"
  pass "step6 production smoke gate"
else
  step6_status="fail"
  printf "FAIL: step6 production smoke gate\n" >&2
fi

if [[ "$step6_status" == "pass" && ( "$step5_status" == "pass" || "$step5_status" == "skipped" ) ]]; then
  overall_status="go"
else
  overall_status="no-go"
fi

generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat >"$GUARDRAIL_REPORT_PATH" <<EOF
{
  "generated_at": "${generated_at}",
  "base_url": "${BASE_URL}",
  "step5_status": "${step5_status}",
  "step6_status": "${step6_status}",
  "overall_status": "${overall_status}",
  "artifacts": {
    "step5_manifest": "/tmp/erain_release_manifest.json",
    "step5_signature": "/tmp/erain_release_manifest.sha256",
    "step6_smoke_report": "${PROD_REPORT_PATH}"
  }
}
EOF

printf "Guardrail report: %s\n" "$GUARDRAIL_REPORT_PATH"
if [[ "$overall_status" == "go" ]]; then
  printf "GO: launch guardrail passed\n"
  exit 0
fi

printf "NO-GO: launch guardrail failed\n" >&2
exit 1
