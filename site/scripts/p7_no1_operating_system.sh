#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

REPORT_PATH="${P7_NO1_REPORT:-/tmp/erain_no1_operating_report.json}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p7_no1_operating_system.sh [options]

Runs Step 7 No.1 operating-system gate and writes a JSON report.

Options:
  --report <path>   Output JSON report path (default: /tmp/erain_no1_operating_report.json)
  --help            Show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report)
      REPORT_PATH="$2"
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

P7_NO1_REPORT="$REPORT_PATH" node scripts/no1_operating_system_gate.mjs
