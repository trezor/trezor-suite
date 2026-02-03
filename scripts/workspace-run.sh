#!/usr/bin/env sh
#
# Interactively select a yarn workspace and run one of its scripts.
#
set -eu

command -v fzf >/dev/null || { echo "fzf is required"; exit 1; }
command -v yarn >/dev/null || { echo "yarn is required"; exit 1; }
command -v jq   >/dev/null || { echo "jq is required"; exit 1; }

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WS_NAME="$(
  yarn workspaces list --json \
  | jq -r '.name' \
  | fzf --prompt='workspace> '
)"

[ -n "$WS_NAME" ] || exit 0

WS_LOCATION="$(
  yarn workspaces list --json \
  | jq -r "select(.name == \"$WS_NAME\") | .location"
)"

SCRIPT="$(
  jq -r '.scripts // {} | keys[]' "$WS_LOCATION/package.json" \
  | sort \
  | fzf --prompt="$WS_NAME script> "
)"

[ -n "$SCRIPT" ] || exit 0

echo
echo "→ yarn workspace $WS_NAME $SCRIPT $*"
echo

exec yarn workspace "$WS_NAME" "$SCRIPT" "$@"

