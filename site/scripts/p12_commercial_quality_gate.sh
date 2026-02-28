#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

REPORT_PATH="${P12_COMMERCIAL_REPORT:-/tmp/erain_commercial_quality_report.json}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p12_commercial_quality_gate.sh [options]

Options:
  --report <path>   Output report path (default: /tmp/erain_commercial_quality_report.json)
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

P12_COMMERCIAL_REPORT="$REPORT_PATH" node scripts/commercial_quality_gate.mjs
