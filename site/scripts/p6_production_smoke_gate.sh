#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PRODUCTION_BASE_URL:-}"
REPORT_PATH="${P6_PRODUCTION_SMOKE_REPORT:-/tmp/erain_production_smoke_report.json}"
ALLOW_INSECURE=0
REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-20}"

usage() {
  cat <<'EOF'
Usage: bash scripts/p6_production_smoke_gate.sh --url <https://domain> [options]

Runs production smoke checks against key launch routes and writes a JSON report.

Options:
  --url <url>            Base URL to check (required unless PRODUCTION_BASE_URL is set).
  --report <path>        Output JSON report path (default: /tmp/erain_production_smoke_report.json).
  --allow-insecure       Allow http:// URL for non-production smoke testing.
  --timeout <seconds>    Curl timeout in seconds (default: 20).
  --help                 Show help.
EOF
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
    --allow-insecure)
      ALLOW_INSECURE=1
      shift
      ;;
    --timeout)
      REQUEST_TIMEOUT_SECONDS="$2"
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
if [[ "$ALLOW_INSECURE" -ne 1 && ! "$BASE_URL" =~ ^https:// ]]; then
  fail "Base URL must use https:// (or pass --allow-insecure for non-production checks)."
fi
if [[ ! "$REQUEST_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]]; then
  fail "Invalid --timeout value: $REQUEST_TIMEOUT_SECONDS"
fi

BASE_URL="${BASE_URL%/}"
TMP_DIR="/tmp/erain_p6_smoke"
mkdir -p "$TMP_DIR"

ROUTES=(
  "/"
  "/pricing"
  "/results"
  "/contact"
  "/sample-report"
  "/sample-report.pdf"
  "/legal"
  "/privacy"
)

OVERALL_STATUS="pass"
declare -a ROUTE_RESULTS=()
declare -a HEADER_RESULTS=()

for route in "${ROUTES[@]}"; do
  safe_key="$(printf "%s" "$route" | tr '/.:-' '_')"
  body_file="${TMP_DIR}/body_${safe_key}.bin"
  header_file="${TMP_DIR}/headers_${safe_key}.txt"
  meta_file="${TMP_DIR}/meta_${safe_key}.txt"

  url="${BASE_URL}${route}"
  curl_opts=(
    --silent
    --show-error
    --location
    --max-time "$REQUEST_TIMEOUT_SECONDS"
    --output "$body_file"
    --dump-header "$header_file"
    --write-out "%{http_code} %{time_total} %{content_type}"
    "$url"
  )

  if ! curl "${curl_opts[@]}" >"$meta_file"; then
    OVERALL_STATUS="fail"
    ROUTE_RESULTS+=("{\"route\":\"${route}\",\"url\":\"${url}\",\"status\":\"fail\",\"reason\":\"curl_error\",\"http_code\":0}")
    printf "FAIL: route check %s (curl error)\n" "$route"
    continue
  fi

  read -r http_code time_total content_type <"$meta_file"
  size_bytes="$(wc -c <"$body_file" | tr -d ' ')"
  route_status="pass"
  reason="ok"

  if [[ ! "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    route_status="fail"
    reason="non_2xx_status"
  fi

  if [[ "$route" == "/sample-report.pdf" ]]; then
    if [[ ! "$content_type" =~ application/pdf ]]; then
      route_status="fail"
      reason="pdf_content_type_mismatch"
    fi
    if (( size_bytes < 5000 )); then
      route_status="fail"
      reason="pdf_too_small"
    fi
  fi

  if [[ "$route_status" == "fail" ]]; then
    OVERALL_STATUS="fail"
    printf "FAIL: route check %s (code=%s, reason=%s)\n" "$route" "$http_code" "$reason"
  else
    pass "route check ${route} (code=${http_code}, ${time_total}s)"
  fi

  ROUTE_RESULTS+=(
    "{\"route\":\"${route}\",\"url\":\"${url}\",\"status\":\"${route_status}\",\"reason\":\"${reason}\",\"http_code\":${http_code},\"time_total_seconds\":${time_total},\"content_type\":\"${content_type}\",\"size_bytes\":${size_bytes}}"
  )
done

root_header_file="${TMP_DIR}/headers__.txt"
required_headers=(
  "content-security-policy"
  "referrer-policy"
  "x-frame-options"
  "x-content-type-options"
)

for header in "${required_headers[@]}"; do
  header_status="pass"
  reason="present"
  if ! rg -i "^${header}:" "$root_header_file" >/dev/null; then
    header_status="fail"
    reason="missing"
    OVERALL_STATUS="fail"
    printf "FAIL: header check %s\n" "$header"
  else
    pass "header check ${header}"
  fi
  HEADER_RESULTS+=("{\"header\":\"${header}\",\"status\":\"${header_status}\",\"reason\":\"${reason}\"}")
done

routes_json="["
for ((i=0; i<${#ROUTE_RESULTS[@]}; i++)); do
  routes_json+="${ROUTE_RESULTS[$i]}"
  if (( i < ${#ROUTE_RESULTS[@]} - 1 )); then
    routes_json+=","
  fi
done
routes_json+="]"

headers_json="["
for ((i=0; i<${#HEADER_RESULTS[@]}; i++)); do
  headers_json+="${HEADER_RESULTS[$i]}"
  if (( i < ${#HEADER_RESULTS[@]} - 1 )); then
    headers_json+=","
  fi
done
headers_json+="]"

generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat >"$REPORT_PATH" <<EOF
{
  "generated_at": "${generated_at}",
  "base_url": "${BASE_URL}",
  "overall_status": "${OVERALL_STATUS}",
  "routes": ${routes_json},
  "header_checks": ${headers_json}
}
EOF

printf "Report: %s\n" "$REPORT_PATH"

if [[ "$OVERALL_STATUS" == "pass" ]]; then
  pass "P6 production smoke gate passed"
  exit 0
fi

fail "P6 production smoke gate failed"
