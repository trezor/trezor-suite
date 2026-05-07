#!/bin/bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

usage() {
    echo "Usage: $0 --report <path> --task <id> --worktree <path>" >&2
    echo "  --report    Path to report JSON (e.g. packages/e2e-utils/src/fixBot/reports/2026-04-23.json)" >&2
    echo "  --task      Fix task ID (e.g. fix-001)" >&2
    echo "  --worktree  Path for the git worktree (e.g. /tmp/trezor-suite-fix-001)" >&2
    exit 1
}

REPORT=""
TASK_ID=""
WORKTREE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --report)   REPORT="$2";   shift 2 ;;
        --task)     TASK_ID="$2";  shift 2 ;;
        --worktree) WORKTREE="$2"; shift 2 ;;
        *) echo "Unknown argument: $1" >&2; usage ;;
    esac
done

[ -z "$REPORT" ]   && { echo "Error: --report is required" >&2;   usage; }
[ -z "$TASK_ID" ]  && { echo "Error: --task is required" >&2;     usage; }
[ -z "$WORKTREE" ] && { echo "Error: --worktree is required" >&2; usage; }

[ -f "$REPORT" ] || { echo "Error: report not found: $REPORT" >&2; exit 1; }

# Extract the fix task from the report
TASK=$(jq --arg id "$TASK_ID" '.fix_tasks[] | select(.id == $id)' "$REPORT")
if [ -z "$TASK" ] || [ "$TASK" = "null" ]; then
    echo "Error: fix task '$TASK_ID' not found in $REPORT" >&2
    echo "Available tasks: $(jq -r '.fix_tasks[].id' "$REPORT" | tr '\n' ' ')" >&2
    exit 1
fi

# Skip non-automatable scopes
FIX_SCOPE=$(echo "$TASK" | jq -r '.fix_scope')
if [ "$FIX_SCOPE" != "TEST_CODE" ] && [ "$FIX_SCOPE" != "LOCATOR_ADD" ]; then
    echo "Skipping task $TASK_ID: fix_scope=$FIX_SCOPE is not automatable (requires human)" >&2
    exit 0
fi

WEB_COUNT=$(echo "$TASK" | jq '[.validations[] | select(.platform == "web")] | length')
DESKTOP_COUNT=$(echo "$TASK" | jq '[.validations[] | select(.platform == "desktop")] | length')

if [ "$WEB_COUNT" -eq 0 ] && [ "$DESKTOP_COUNT" -eq 0 ]; then
    echo "Skipping task $TASK_ID: no validations" >&2
    exit 0
fi

BRANCH=$(echo "$TASK" | jq -r '.branch')
echo "Task:            $TASK_ID"
echo "Scope:           $FIX_SCOPE"
echo "Branch:          $BRANCH"
echo "Web validations: $WEB_COUNT"
echo "Desktop validations: $DESKTOP_COUNT"
echo "Worktree:        $WORKTREE"
echo ""

# Create worktree on the fix branch (branched from develop)
if [ -d "$WORKTREE" ]; then
    echo "Error: worktree path already exists: $WORKTREE" >&2
    echo "Remove it first with: git worktree remove $WORKTREE --force" >&2
    exit 1
fi

echo "Creating worktree on branch $BRANCH..."
git worktree add "$WORKTREE" -b "$BRANCH" develop


# Symlink node_modules so playwright and yarn scripts work
ln -s "$ROOT/node_modules" "$WORKTREE/node_modules"

# Override personal global core.hooksPath with the repo hooks in this checkout
git -C "$WORKTREE" config core.hooksPath "$WORKTREE/.husky"

# Copy e2e .env so CI secrets (e.g. PASSPHRASE) are available to the test runner
if [ -f "$ROOT/suite/e2e/.env" ]; then
    cp "$ROOT/suite/e2e/.env" "$WORKTREE/suite/e2e/.env"
    echo "Copied suite/e2e/.env into worktree."
fi

# Symlink pre-built Electron app so desktop TEST_CODE fixes don't require a rebuild.
# For LOCATOR_ADD desktop fixes the agent will remove the symlink and rebuild.
for dir in packages/suite-desktop/dist packages/suite-desktop/build; do
    if [ -d "$ROOT/$dir" ]; then
        mkdir -p "$WORKTREE/$(dirname "$dir")"
        ln -s "$ROOT/$dir" "$WORKTREE/$dir"
        echo "Symlinked $dir from main repo."
    fi
done

echo "Worktree ready."
echo ""

CLAUDE_BIN="$ROOT/node_modules/.bin/claude"
FIX_AGENT_MD="$ROOT/packages/e2e-utils/src/fixBot/FIX_AGENT.md"
SETTINGS="$ROOT/packages/e2e-utils/src/fixBot/settings.json"

echo "Starting fix agent for task $TASK_ID..."
cd "$WORKTREE"
unset MCP_CONNECTION_NONBLOCKING

{
    cat "$FIX_AGENT_MD"
    printf '\n\n---\n\n## Fix Task\n\n```json\n'
    echo "$TASK"
    printf '```\n'
} | "$CLAUDE_BIN" --verbose --print \
    --settings "$SETTINGS"
