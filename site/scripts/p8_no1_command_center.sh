#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

GATE_REPORT_PATH="${P7_NO1_REPORT:-/tmp/erain_no1_operating_report.json}"
REPORT_PATH="${P8_NO1_COMMAND_CENTER_REPORT:-/tmp/erain_no1_command_center_report.json}"
BRIEF_PATH="${P8_NO1_WEEKLY_BRIEF:-/tmp/erain_no1_weekly_brief.md}"
MAX_AGE_DAYS="${P8_NO1_MAX_AGE_DAYS:-8}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p8_no1_command_center.sh [options]

Runs Step 8 command-center checks and generates a weekly exec brief.

Options:
  --gate-report <path>  P7 gate report input path (default: /tmp/erain_no1_operating_report.json)
  --report <path>       P8 JSON report output path (default: /tmp/erain_no1_command_center_report.json)
  --brief <path>        Weekly markdown brief output path (default: /tmp/erain_no1_weekly_brief.md)
  --max-age-days <n>    Maximum tracker age in days (default: 8)
  --skip-p7             Skip running Step 7 before Step 8
  --help                Show help
USAGE
}

RUN_P7=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --gate-report)
      GATE_REPORT_PATH="$2"
      shift 2
      ;;
    --report)
      REPORT_PATH="$2"
      shift 2
      ;;
    --brief)
      BRIEF_PATH="$2"
      shift 2
      ;;
    --max-age-days)
      MAX_AGE_DAYS="$2"
      shift 2
      ;;
    --skip-p7)
      RUN_P7=0
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

if [[ "$RUN_P7" -eq 1 ]]; then
  bash scripts/p7_no1_operating_system.sh --report "$GATE_REPORT_PATH"
fi

P7_NO1_REPORT="$GATE_REPORT_PATH" \
P8_NO1_COMMAND_CENTER_REPORT="$REPORT_PATH" \
P8_NO1_WEEKLY_BRIEF="$BRIEF_PATH" \
P8_NO1_MAX_AGE_DAYS="$MAX_AGE_DAYS" \
node scripts/no1_command_center.mjs --gate-report "$GATE_REPORT_PATH" --report "$REPORT_PATH" --brief "$BRIEF_PATH" --max-age-days "$MAX_AGE_DAYS"
