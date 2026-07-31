#!/usr/bin/env bash
# [throwaway: bcl request baseline] Off-limits guard for the optimization loop.
# Fails (exit 1) if the current iteration's diff touches the measurement "ruler".
# The agent MUST run this before reporting success; a violation => report success:false (revert).
#
# Usage: off-limits-guard.sh [git-range]
#   default range compares the working tree (staged+unstaged) against HEAD.
#   pass a range (e.g. "origin/mroz22/blockchain-link-request-baseline...HEAD") to check committed work.
set -uo pipefail

RANGE="${1:-HEAD}"

# Whole paths/prefixes the agent must never modify (the ruler + its config + goldens).
OFF_LIMITS=(
  "suite/e2e/tests/wallet/discovery.test.ts"
  "suite/e2e/tests/wallet/bcl-golden.json"
  "suite/e2e/scripts/bcl/"
  ".context/bcl-analyze.mjs"
  "packages/suite-desktop-core/src/modules/backend-request-logger.ts"
  ".github/workflows/template-suite-run-e2e.yml"
  ".github/workflows/test-suite-web-desktop-e2e-pr.yml"
  ".github/workflows/bcl-deploy-viewer.yml"
)

# Shared production files that the agent MAY edit, but whose __bclWrite__ tap block is off-limits.
TAP_FILES=(
  "packages/blockchain-link/src/index.ts"
  "packages/websocket-client/src/client.ts"
)

changed="$( { git diff --name-only "$RANGE"; git diff --name-only --cached; } | sort -u )"

violations=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  for o in "${OFF_LIMITS[@]}"; do
    case "$f" in "$o"*) violations+=("$f") ;; esac
  done
done <<< "$changed"

for tf in "${TAP_FILES[@]}"; do
  if git diff "$RANGE" -- "$tf" | grep -qE '^[+-].*__bclWrite__'; then
    violations+=("$tf (touched the __bclWrite__ tap block)")
  fi
done

if [ "${#violations[@]}" -gt 0 ]; then
  echo "OFF-LIMITS VIOLATION — the iteration touched the measurement ruler; this is not a real optimization:" >&2
  printf '  - %s\n' "${violations[@]}" >&2
  exit 1
fi

echo "off-limits guard: OK (measurement ruler untouched)"
