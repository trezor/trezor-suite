#!/usr/bin/env bash
#
# Measure one passphrase coin variant — two separate Flashlight runs:
#   1. the whole passphrase flow (open-passphrase-<variant>.yaml, ends at the scrolled
#      transaction list)                                  -> flashlight-passphrase-<variant>.json
#   2. the warm reload (reload-graph.yaml) of the persisted state
#                                                          -> flashlight-reload-<variant>.json
#
# Between them, _persist.yaml (NOT measured) takes the app from the scenario's end state
# (Home -> disconnect -> keep view-only) so the reload has persisted state to render.
# The scenario and reload are profiled separately because Flashlight's profiler is bound
# to one process and crashes on a mid-measurement app restart/disconnect — so neither
# measured flow contains one.
#
# Usage: .maestro/passphrase-wallet/measure.sh <variant> [scenario_ms] [reload_ms]
#   variant: btc | eth | sol | btc-eth-sol
#
# Prereqs (see .maestro/README.md): user-env up, shim on :9011, develop build installed.
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo root

VARIANT="${1:?variant required: btc | eth | sol | btc-eth-sol}"
SCENARIO_MS="${2:-180000}"
RELOAD_MS="${3:-15000}"   # reload-graph measured ~7.5s
BUNDLE="io.trezor.suite.develop"
DIR=".maestro/passphrase-wallet"
FLOW="$DIR/open-passphrase-$VARIANT.yaml"

[ -f "$FLOW" ] || { echo "Unknown variant '$VARIANT' (no $FLOW)"; exit 1; }

# Preflight: device-env side must be up.
curl -s -o /dev/null "http://127.0.0.1:9002" || { echo "✗ user-env not reachable on :9002 — start it first"; exit 1; }
lsof -ti :9011 >/dev/null || { echo "✗ shim not running on :9011 — run: yarn tsx .maestro/user-env-rest/server.ts"; exit 1; }
adb reverse tcp:21328 tcp:21328 >/dev/null

echo "=== [$VARIANT] 1/2 passphrase flow (${SCENARIO_MS}ms) ==="
flashlight test --bundleId "$BUNDLE" \
  --testCommand "maestro test $FLOW" \
  --duration "$SCENARIO_MS" --iterationCount 1 \
  --resultsFilePath "flashlight-passphrase-$VARIANT.json" --record

echo "=== [$VARIANT] persisting wallet for reload (unmeasured) ==="
maestro test "$DIR/_persist.yaml"

echo "=== [$VARIANT] 2/2 warm reload (${RELOAD_MS}ms) ==="
flashlight test --bundleId "$BUNDLE" \
  --beforeEachCommand "adb shell am force-stop $BUNDLE" \
  --testCommand "maestro test $DIR/reload-graph.yaml" \
  --duration "$RELOAD_MS" --iterationCount 1 \
  --resultsFilePath "flashlight-reload-$VARIANT.json" --record

echo "=== [$VARIANT] done -> flashlight-passphrase-$VARIANT.json, flashlight-reload-$VARIANT.json ==="
