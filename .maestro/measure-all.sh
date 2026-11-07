#!/usr/bin/env bash
#
# Run all Flashlight measurements:
#   - portfolio tracker (watch-only)            -> flashlight-portfolio.json
#   - onboard + connect (scenario)              -> flashlight-onboard-connect.json
#   - onboard + connect (warm reload)           -> flashlight-reload-onboard-connect.json
#   - passphrase variants (scenario + reload)   -> flashlight-passphrase-*.json / flashlight-reload-*.json
#
# Device+discovery scenarios and their reload are measured as SEPARATE runs: Flashlight's
# profiler crashes on a mid-measurement app restart/disconnect, so the persist step
# (passphrase-wallet/_persist.yaml: Home -> disconnect -> keep view-only) runs unmeasured
# between a scenario and its reload.
#
# Prereqs (see .maestro/README.md): user-env up, shim on :9011, develop build installed.
set -euo pipefail

cd "$(dirname "$0")/.."   # repo root

BUNDLE="io.trezor.suite.develop"
PW=".maestro/passphrase-wallet"

# Preflight: device-env side must be up (portfolio is watch-only and won't use it,
# but the connected-device tests do).
curl -s -o /dev/null "http://127.0.0.1:9002" || { echo "✗ user-env not reachable on :9002 — start it first"; exit 1; }
lsof -ti :9011 >/dev/null || { echo "✗ shim not running on :9011 — run: yarn tsx .maestro/user-env-rest/server.ts"; exit 1; }
adb reverse tcp:21328 tcp:21328 >/dev/null

# measure <name> <flow> <duration_ms>
measure() {
  echo "=== measure: $1 ($3 ms) ==="
  flashlight test --bundleId "$BUNDLE" \
    --testCommand "maestro test $2" \
    --duration "$3" --iterationCount 1 \
    --resultsFilePath "flashlight-$1.json" --record
}

# measure_reload <name> <duration_ms>  (force-stop first; profiles one fresh launch)
measure_reload() {
  echo "=== measure reload: $1 ($2 ms) ==="
  flashlight test --bundleId "$BUNDLE" \
    --beforeEachCommand "adb shell am force-stop $BUNDLE" \
    --testCommand "maestro test $PW/reload-graph.yaml" \
    --duration "$2" --iterationCount 1 \
    --resultsFilePath "flashlight-reload-$1.json" --record
}

# --- Portfolio tracker (watch-only; scenario only) ---
measure portfolio ".maestro/portfolio-tracker-device/import-btc-dev-xpub.yaml" 150000

# --- Onboard + connect (scenario, then warm reload of the persisted state) ---
measure onboard-connect ".maestro/onboard-and-connect/onboard-and-connect.yaml" 300000
maestro test "$PW/_persist.yaml"          # persist (unmeasured)
measure_reload onboard-connect 30000

# --- Passphrase variants (scenario + reload each) ---
"$PW/measure-all.sh"

echo "=== all measurements done — results: flashlight-*.json ==="
