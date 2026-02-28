#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

BASE_URL="${PRODUCTION_BASE_URL:-https://erainai.com}"
RUN_P9=1
RUN_P10=1
RUN_P11=1
RUN_P12=1
RUN_P8=1
P9_SKIP_LAUNCH=0
REPORT_PATH="${P13_EXEC_REPORT:-/tmp/erain_exec_control_tower_report.json}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p13_exec_control_tower.sh [options]

Options:
  --url <url>        Base URL for p9 global gate (default: PRODUCTION_BASE_URL or https://erainai.com)
  --report <path>    Output report path (default: /tmp/erain_exec_control_tower_report.json)
  --skip-p8          Skip p8 command-center run
  --skip-p9          Skip p9 global gate run
  --skip-launch      Forward --skip-launch to p9 global gate
  --skip-p10         Skip p10 niche gate run
  --skip-p11         Skip p11 reliability gate run
  --skip-p12         Skip p12 commercial gate run
  --help             Show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --report)
      REPORT_PATH="$2"
      shift 2
      ;;
    --skip-p8)
      RUN_P8=0
      shift
      ;;
    --skip-p9)
      RUN_P9=0
      shift
      ;;
    --skip-launch)
      P9_SKIP_LAUNCH=1
      shift
      ;;
    --skip-p10)
      RUN_P10=0
      shift
      ;;
    --skip-p11)
      RUN_P11=0
      shift
      ;;
    --skip-p12)
      RUN_P12=0
      shift
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

if [[ "$RUN_P8" -eq 1 ]]; then
  bash scripts/p8_no1_command_center.sh
fi

if [[ "$RUN_P9" -eq 1 ]]; then
  p9_args=(--url "$BASE_URL")
  if [[ "$P9_SKIP_LAUNCH" -eq 1 ]]; then
    p9_args+=(--skip-launch)
  fi
  bash scripts/p9_global_standard_gate.sh "${p9_args[@]}"
fi

if [[ "$RUN_P10" -eq 1 ]]; then
  bash scripts/p10_niche_leadership.sh --skip-p8
fi

if [[ "$RUN_P11" -eq 1 ]]; then
  bash scripts/p11_reliability_slo_gate.sh
fi

if [[ "$RUN_P12" -eq 1 ]]; then
  bash scripts/p12_commercial_quality_gate.sh
fi

P13_EXEC_REPORT="$REPORT_PATH" node scripts/exec_control_tower.mjs
