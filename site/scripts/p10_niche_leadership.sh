#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

RUN_P8=1
P8_REPORT_PATH="${P8_NO1_COMMAND_CENTER_REPORT:-/tmp/erain_no1_command_center_report.json}"
P8_BRIEF_PATH="${P8_NO1_WEEKLY_BRIEF:-/tmp/erain_no1_weekly_brief.md}"
P10_REPORT_PATH="${P10_NICHE_REPORT:-/tmp/erain_niche_leadership_report.json}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p10_niche_leadership.sh [options]

Runs niche leadership gate (optionally after command-center gate).

Options:
  --skip-p8          Skip running Step 8 command-center gate first
  --report <path>    Output report path for Step 10 (default: /tmp/erain_niche_leadership_report.json)
  --help             Show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-p8)
      RUN_P8=0
      shift
      ;;
    --report)
      P10_REPORT_PATH="$2"
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

if [[ "$RUN_P8" -eq 1 ]]; then
  bash scripts/p8_no1_command_center.sh --report "$P8_REPORT_PATH" --brief "$P8_BRIEF_PATH"
fi

P10_NICHE_REPORT="$P10_REPORT_PATH" node scripts/no1_niche_leadership_gate.mjs
