#!/bin/bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Load API key from local .env if present (set -a auto-exports all variables)
if [ -f packages/e2e-utils/.env ]; then
    set -a
    # shellcheck disable=SC1091
    source packages/e2e-utils/.env
    set +a
fi

if [ -z "${CURRENTS_API_KEY:-}" ]; then
    echo "Error: CURRENTS_API_KEY is not set." >&2
    echo "Add it to packages/e2e-utils/.env:" >&2
    echo "  CURRENTS_API_KEY=your_key_here" >&2
    exit 1
fi

CLAUDE_BIN="$ROOT/node_modules/.bin/claude"

REPORT_DIR="$ROOT/packages/e2e-utils/src/fixBot/reports"
REPORT_FILE="$REPORT_DIR/$(date +%Y-%m-%d).md"
mkdir -p "$REPORT_DIR"

echo "Starting nightly test failure analysis..."
unset MCP_CONNECTION_NONBLOCKING
"$CLAUDE_BIN" --verbose --print \
    --settings packages/e2e-utils/src/fixBot/settings.json \
    --mcp-config packages/e2e-utils/src/fixBot/mcp.json \
    --strict-mcp-config \
    < packages/e2e-utils/src/fixBot/AGENT.md \
    | tee "$REPORT_FILE"

echo ""
echo "Report saved to $REPORT_FILE"
