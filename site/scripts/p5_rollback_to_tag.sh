#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$SITE_ROOT/.." && pwd)"

TARGET_TAG=""
MODE="plan" # plan | detach | reset-branch
BRANCH="main"
CONFIRM=0
ALLOW_DESTRUCTIVE=0
PUSH_AFTER_RESET=0
ALLOW_DIRTY=0
CREATE_SAFETY_TAG=1

usage() {
  cat <<'EOF'
Usage:
  bash scripts/p5_rollback_to_tag.sh --tag <tag> [options]

Modes:
  --mode plan           Print rollback plan only (default; no repo change).
  --mode detach         Switch to detached HEAD at target tag (safe local rollback).
  --mode reset-branch   Hard-reset branch to target tag (destructive; explicit opt-in required).

Options:
  --tag <tag>           Target tag to roll back to (required).
  --branch <branch>     Branch for reset-branch mode (default: main).
  --confirm             Required for non-plan modes.
  --allow-destructive   Required for reset-branch mode.
  --push                In reset-branch mode, push with --force-with-lease after reset.
  --allow-dirty         Allow running with dirty working tree.
  --no-safety-tag       Disable safety tag creation (blocked for non-plan modes).
  --help                Show help.

Safety:
  - By default, a safety tag is created before any rollback action.
  - For rollback modes (detach/reset-branch), safety tags cannot be disabled.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      TARGET_TAG="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --confirm)
      CONFIRM=1
      shift
      ;;
    --allow-destructive)
      ALLOW_DESTRUCTIVE=1
      shift
      ;;
    --push)
      PUSH_AFTER_RESET=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    --no-safety-tag)
      CREATE_SAFETY_TAG=0
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

pass() { printf "PASS: %s\n" "$1"; }
fail() { printf "FAIL: %s\n" "$1"; exit 1; }

[[ -n "$TARGET_TAG" ]] || fail "Missing required --tag <tag>"
[[ "$MODE" == "plan" || "$MODE" == "detach" || "$MODE" == "reset-branch" ]] || fail "Invalid mode: $MODE"

if [[ "$MODE" != "plan" && "$CREATE_SAFETY_TAG" -ne 1 ]]; then
  fail "Safety tag is mandatory for rollback actions. Remove --no-safety-tag."
fi

if [[ "$MODE" != "plan" && "$CONFIRM" -ne 1 ]]; then
  fail "Rollback mode '$MODE' requires --confirm"
fi

if [[ "$MODE" == "reset-branch" && "$ALLOW_DESTRUCTIVE" -ne 1 ]]; then
  fail "reset-branch mode requires --allow-destructive"
fi

if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/${TARGET_TAG}" >/dev/null; then
  pass "Target tag exists: ${TARGET_TAG}"
else
  fail "Tag not found: ${TARGET_TAG}"
fi

if [[ "$ALLOW_DIRTY" -ne 1 ]]; then
  if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
    fail "Working tree is dirty. Commit/stash changes or use --allow-dirty."
  fi
fi

CURRENT_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
CURRENT_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
TS="$(date -u +"%Y%m%dT%H%M%SZ")"
SAFETY_TAG="safety-pre-rollback-${TS}-${CURRENT_SHA:0:7}"

printf "Rollback plan\n"
printf "  repo: %s\n" "$REPO_ROOT"
printf "  current branch: %s\n" "$CURRENT_BRANCH"
printf "  current sha: %s\n" "$CURRENT_SHA"
printf "  target tag: %s\n" "$TARGET_TAG"
printf "  mode: %s\n" "$MODE"
if [[ "$CREATE_SAFETY_TAG" -eq 1 ]]; then
  printf "  safety tag: %s\n" "$SAFETY_TAG"
fi
if [[ "$MODE" == "reset-branch" ]]; then
  printf "  reset branch: %s\n" "$BRANCH"
  printf "  push after reset: %s\n" "$([[ "$PUSH_AFTER_RESET" -eq 1 ]] && echo yes || echo no)"
fi

if [[ "$MODE" == "plan" ]]; then
  pass "Plan generated. No changes applied."
  exit 0
fi

if [[ "$CREATE_SAFETY_TAG" -eq 1 ]]; then
  if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/${SAFETY_TAG}" >/dev/null; then
    fail "Safety tag already exists: ${SAFETY_TAG}"
  fi
  git -C "$REPO_ROOT" tag -a "$SAFETY_TAG" "$CURRENT_SHA" -m "Safety tag before rollback to ${TARGET_TAG}"
  pass "Created safety tag: $SAFETY_TAG"
fi

if [[ "$MODE" == "detach" ]]; then
  git -C "$REPO_ROOT" switch --detach "$TARGET_TAG"
  pass "Detached HEAD at tag: $TARGET_TAG"
  exit 0
fi

git -C "$REPO_ROOT" checkout "$BRANCH"
git -C "$REPO_ROOT" reset --hard "$TARGET_TAG"
pass "Branch $BRANCH reset to tag $TARGET_TAG"

if [[ "$PUSH_AFTER_RESET" -eq 1 ]]; then
  git -C "$REPO_ROOT" push --force-with-lease origin "$BRANCH"
  pass "Force-with-lease push completed for $BRANCH"
else
  pass "Local reset complete. Push not executed."
fi
