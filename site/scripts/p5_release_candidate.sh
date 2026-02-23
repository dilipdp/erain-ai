#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$SITE_ROOT/.." && pwd)"

MANIFEST_PATH="${RELEASE_MANIFEST_PATH:-/tmp/erain_release_manifest.json}"
SIGNATURE_PATH="${RELEASE_MANIFEST_SIGNATURE_PATH:-/tmp/erain_release_manifest.sha256}"
GATE_COOLDOWN_SECONDS="${GATE_COOLDOWN_SECONDS:-2}"
SKIP_TAGS=0

usage() {
  cat <<'EOF'
Usage: bash scripts/p5_release_candidate.sh [--skip-tags] [--manifest <path>] [--signature <path>]

Runs all launch gates in strict order:
  1) launch_qa_checklist
  2) p0_hardening_checks
  3) p1_launch_quality_gate
  4) p2_device_browser_matrix_gate
  5) p3_analytics_consent_gate
  6) p4_seo_trust_release_gate

On success:
  - writes release manifest JSON
  - writes sha256 signature file
  - creates tags by default:
      safety-pre-release-<UTC timestamp>
      release-candidate-<UTC timestamp>

Options:
  --skip-tags           Do not create git tags (useful for dry-run validation).
  --manifest <path>     Override manifest output path.
  --signature <path>    Override manifest signature output path.
  --help                Show help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tags)
      SKIP_TAGS=1
      shift
      ;;
    --manifest)
      MANIFEST_PATH="$2"
      shift 2
      ;;
    --signature)
      SIGNATURE_PATH="$2"
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

gate_cooldown() {
  local seconds="$1"
  if [[ "$seconds" =~ ^[0-9]+$ ]] && (( seconds > 0 )); then
    sleep "$seconds"
  fi
}

declare -a GATE_NAMES=()
declare -a GATE_STATUSES=()
declare -a GATE_DURATIONS_MS=()
declare -a GATE_LOGS=()

OVERALL_STATUS="pass"
SAFETY_TAG=""
RELEASE_TAG=""

run_gate() {
  local name="$1"
  shift
  local start_s end_s duration_ms
  local log_hint="stdout"

  start_s="$(date +%s)"

  if "$@"; then
    GATE_NAMES+=("$name")
    GATE_STATUSES+=("pass")
    GATE_LOGS+=("$log_hint")
    end_s="$(date +%s)"
    duration_ms=$(((end_s - start_s) * 1000))
    GATE_DURATIONS_MS+=("$duration_ms")
    pass "gate $name (${duration_ms}ms)"
    return 0
  else
    GATE_NAMES+=("$name")
    GATE_STATUSES+=("fail")
    GATE_LOGS+=("$log_hint")
    end_s="$(date +%s)"
    duration_ms=$(((end_s - start_s) * 1000))
    GATE_DURATIONS_MS+=("$duration_ms")
    OVERALL_STATUS="fail"
    printf "Gate failed: %s\n" "$name" >&2
    return 1
  fi
}

write_manifest() {
  local generated_at head_sha branch dirty gates_json tags_json
  generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  head_sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  branch="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
    dirty="true"
  else
    dirty="false"
  fi

  gates_json="["
  local i
  for ((i=0; i<${#GATE_NAMES[@]}; i++)); do
    gates_json+="{\"name\":\"${GATE_NAMES[$i]}\",\"status\":\"${GATE_STATUSES[$i]}\",\"duration_ms\":${GATE_DURATIONS_MS[$i]},\"log\":\"${GATE_LOGS[$i]}\"}"
    if (( i < ${#GATE_NAMES[@]} - 1 )); then
      gates_json+=","
    fi
  done
  gates_json+="]"

  tags_json="{\"safety_pre_release\":\"${SAFETY_TAG}\",\"release_candidate\":\"${RELEASE_TAG}\"}"

  cat >"$MANIFEST_PATH" <<EOF
{
  "generated_at": "${generated_at}",
  "repository": "erain-ai",
  "branch": "${branch}",
  "commit": "${head_sha}",
  "working_tree_dirty": ${dirty},
  "overall_status": "${OVERALL_STATUS}",
  "gates": ${gates_json},
  "artifacts": {
    "quality_gate_report": "/tmp/erain_quality_gate_report.json",
    "device_matrix_report": "/tmp/erain_device_browser_matrix_report.json",
    "analytics_consent_report": "/tmp/erain_analytics_consent_gate_report.json",
    "seo_trust_report": "/tmp/erain_seo_trust_gate_report.json",
    "device_matrix_screenshots": "/tmp/erain_device_matrix_shots"
  },
  "tags": ${tags_json}
}
EOF
}

sign_manifest() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$MANIFEST_PATH" >"$SIGNATURE_PATH"
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$MANIFEST_PATH" >"$SIGNATURE_PATH"
  else
    fail "No SHA-256 tool found (expected shasum or sha256sum)"
  fi
}

create_release_tags() {
  local ts head_sha
  ts="$(date -u +"%Y%m%dT%H%M%SZ")"
  head_sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  SAFETY_TAG="safety-pre-release-${ts}"
  RELEASE_TAG="release-candidate-${ts}"

  if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/${SAFETY_TAG}" >/dev/null; then
    fail "Tag already exists: ${SAFETY_TAG}"
  fi
  if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/${RELEASE_TAG}" >/dev/null; then
    fail "Tag already exists: ${RELEASE_TAG}"
  fi

  git -C "$REPO_ROOT" tag -a "$SAFETY_TAG" "$head_sha" -m "Safety tag before release candidate validation (${ts})"
  git -C "$REPO_ROOT" tag -a "$RELEASE_TAG" "$head_sha" -m "Release candidate tag (${ts})"
  pass "Created tags: $SAFETY_TAG, $RELEASE_TAG"
}

printf "Running P5 release certification in %s\n" "$SITE_ROOT"
cd "$SITE_ROOT"

run_gate "launch_qa" bash scripts/launch_qa_checklist.sh || true
if [[ "$OVERALL_STATUS" == "pass" ]]; then gate_cooldown "$GATE_COOLDOWN_SECONDS"; run_gate "p0_hardening" bash scripts/p0_hardening_checks.sh || true; fi
if [[ "$OVERALL_STATUS" == "pass" ]]; then gate_cooldown "$GATE_COOLDOWN_SECONDS"; run_gate "p1_quality" bash scripts/p1_launch_quality_gate.sh || true; fi
if [[ "$OVERALL_STATUS" == "pass" ]]; then gate_cooldown "$GATE_COOLDOWN_SECONDS"; run_gate "p2_matrix" bash scripts/p2_device_browser_matrix_gate.sh || true; fi
if [[ "$OVERALL_STATUS" == "pass" ]]; then gate_cooldown "$GATE_COOLDOWN_SECONDS"; run_gate "p3_analytics" bash scripts/p3_analytics_consent_gate.sh || true; fi
if [[ "$OVERALL_STATUS" == "pass" ]]; then gate_cooldown "$GATE_COOLDOWN_SECONDS"; run_gate "p4_seo_trust" bash scripts/p4_seo_trust_release_gate.sh || true; fi

if [[ "$OVERALL_STATUS" == "pass" && "$SKIP_TAGS" -eq 0 ]]; then
  create_release_tags
fi

write_manifest
sign_manifest

printf "Manifest: %s\n" "$MANIFEST_PATH"
printf "Signature: %s\n" "$SIGNATURE_PATH"

if [[ "$OVERALL_STATUS" == "pass" ]]; then
  pass "P5 release certification passed"
  exit 0
fi

fail "P5 release certification failed"
