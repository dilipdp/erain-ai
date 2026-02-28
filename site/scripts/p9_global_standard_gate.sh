#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

BASE_URL="${PRODUCTION_BASE_URL:-}"
ALLOW_INSECURE=0
SKIP_STEP5=1
SKIP_LAUNCH=0
REPORT_PATH="${P9_GLOBAL_STANDARD_REPORT:-/tmp/erain_global_standard_gate_report.json}"
GUARDRAIL_REPORT_PATH="${P6_LAUNCH_GUARDRAIL_REPORT:-/tmp/erain_launch_guardrail_report.json}"
OPS_REPORT_PATH="${P8_NO1_COMMAND_CENTER_REPORT:-/tmp/erain_no1_command_center_report.json}"
OPS_BRIEF_PATH="${P8_NO1_WEEKLY_BRIEF:-/tmp/erain_no1_weekly_brief.md}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p9_global_standard_gate.sh --url <https://domain> [options]

Runs production launch guardrail + no1 command center and outputs one release decision.

Options:
  --url <url>            Production base URL (required unless PRODUCTION_BASE_URL is set)
  --allow-insecure       Allow http:// URL for non-production checks
  --run-step5            Include Step 5 release-candidate checks in launch guardrail
  --skip-launch          Skip Step 6 launch guardrail (for offline ops-only checks)
  --report <path>        Combined gate report path (default: /tmp/erain_global_standard_gate_report.json)
  --guardrail-report <path>  Step 6 guardrail report path
  --ops-report <path>    Step 8 command-center JSON report path
  --ops-brief <path>     Step 8 markdown brief path
  --help                 Show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --allow-insecure)
      ALLOW_INSECURE=1
      shift
      ;;
    --run-step5)
      SKIP_STEP5=0
      shift
      ;;
    --skip-launch)
      SKIP_LAUNCH=1
      shift
      ;;
    --report)
      REPORT_PATH="$2"
      shift 2
      ;;
    --guardrail-report)
      GUARDRAIL_REPORT_PATH="$2"
      shift 2
      ;;
    --ops-report)
      OPS_REPORT_PATH="$2"
      shift 2
      ;;
    --ops-brief)
      OPS_BRIEF_PATH="$2"
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

fail() { printf "FAIL: %s\n" "$1" >&2; exit 1; }
pass() { printf "PASS: %s\n" "$1"; }

if [[ "$SKIP_LAUNCH" -ne 1 ]]; then
  [[ -n "$BASE_URL" ]] || fail "Missing base URL. Use --url <https://domain>."
fi

launch_status="skipped"
if [[ "$SKIP_LAUNCH" -ne 1 ]]; then
  launch_args=(--url "$BASE_URL" --report "$GUARDRAIL_REPORT_PATH")
  if [[ "$ALLOW_INSECURE" -eq 1 ]]; then
    launch_args+=(--allow-insecure)
  fi
  if [[ "$SKIP_STEP5" -eq 1 ]]; then
    launch_args+=(--skip-step5)
  fi

  bash scripts/p6_launch_guardrail.sh "${launch_args[@]}"
  launch_status="pass"
  pass "launch guardrail passed"
else
  pass "launch guardrail skipped"
fi

ops_args=(--report "$OPS_REPORT_PATH" --brief "$OPS_BRIEF_PATH")
bash scripts/p8_no1_command_center.sh "${ops_args[@]}"
pass "command-center gate passed"

ops_status="unknown"
ops_warnings="0"
if [[ -f "$OPS_REPORT_PATH" ]]; then
  ops_status="$(node -e 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); process.stdout.write(String(j?.summary?.status || "unknown"));' "$OPS_REPORT_PATH")"
  ops_warnings="$(node -e 'const fs=require("fs"); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,"utf8")); process.stdout.write(String(j?.summary?.warning_count ?? 0));' "$OPS_REPORT_PATH")"
fi

overall_status="go"
if [[ "$ops_status" == "attention" ]]; then
  overall_status="go_with_actions"
fi

if [[ "$ops_status" == "fail" || "$launch_status" == "fail" ]]; then
  overall_status="no-go"
fi

generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat >"$REPORT_PATH" <<JSON
{
  "generated_at": "$generated_at",
  "base_url": "$BASE_URL",
  "launch_status": "$launch_status",
  "launch_guardrail_report": "$GUARDRAIL_REPORT_PATH",
  "ops_command_center_report": "$OPS_REPORT_PATH",
  "ops_weekly_brief": "$OPS_BRIEF_PATH",
  "ops_status": "$ops_status",
  "ops_warning_count": $ops_warnings,
  "overall_status": "$overall_status"
}
JSON

printf "Report: %s\n" "$REPORT_PATH"

if [[ "$overall_status" == "go" ]]; then
  pass "global-standard gate = GO"
  exit 0
fi

if [[ "$overall_status" == "go_with_actions" ]]; then
  printf "PASS: global-standard gate = GO_WITH_ACTIONS (warnings present)\n"
  exit 0
fi

fail "global-standard gate = NO-GO"
