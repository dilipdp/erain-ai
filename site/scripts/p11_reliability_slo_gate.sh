#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_ROOT"

REPORT_PATH="${P11_RELIABILITY_REPORT:-/tmp/erain_reliability_slo_report.json}"

usage() {
  cat <<'USAGE'
Usage: bash scripts/p11_reliability_slo_gate.sh [options]

Options:
  --report <path>   Output report path (default: /tmp/erain_reliability_slo_report.json)
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

P11_RELIABILITY_REPORT="$REPORT_PATH" node scripts/reliability_slo_gate.mjs
