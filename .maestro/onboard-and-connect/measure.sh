#!/usr/bin/env bash
#
# Measure the onboard + connect flow, then its warm reload — two separate Flashlight runs:
#   1. onboard-and-connect.yaml (onboarding + all-coin discovery + tx-list scroll)
#                                                  -> flashlight-onboard-connect.json
#   2. warm reload (reload-graph.yaml) of the persisted state
#                                                  -> flashlight-reload-onboard-connect.json
#
# Between them, _persist.yaml (NOT measured) takes the app Home -> disconnect -> keep
# view-only so the reload has persisted state. They're separate runs because Flashlight's
# profiler crashes on a mid-measurement app restart/disconnect.
#
# Usage: .maestro/onboard-and-connect/measure.sh [scenario_ms] [reload_ms]
#
# Prereqs (see .maestro/README.md): user-env up, shim on :9011, develop build installed.
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo root

SCENARIO_MS="${1:-300000}"   # all-coin discovery is long; tighten after `time maestro test`
RELOAD_MS="${2:-30000}"      # all-coin reload is heavier than a single-coin one
BUNDLE="io.trezor.suite.develop"
OC=".maestro/onboard-and-connect"
PW=".maestro/passphrase-wallet"

# Preflight: device-env side must be up.
curl -s -o /dev/null "http://127.0.0.1:9002" || { echo "✗ user-env not reachable on :9002 — start it first"; exit 1; }
lsof -ti :9011 >/dev/null || { echo "✗ shim not running on :9011 — run: yarn tsx .maestro/user-env-rest/server.ts"; exit 1; }
adb reverse tcp:21328 tcp:21328 >/dev/null

echo "=== onboard-connect 1/2 scenario (${SCENARIO_MS}ms) ==="
flashlight test --bundleId "$BUNDLE" \
  --testCommand "maestro test $OC/onboard-and-connect.yaml" \
  --duration "$SCENARIO_MS" --iterationCount 1 \
  --resultsFilePath "flashlight-onboard-connect.json" --record

echo "=== onboard-connect persisting wallet for reload (unmeasured) ==="
maestro test "$PW/_persist.yaml"

echo "=== onboard-connect 2/2 warm reload (${RELOAD_MS}ms) ==="
flashlight test --bundleId "$BUNDLE" \
  --beforeEachCommand "adb shell am force-stop $BUNDLE" \
  --testCommand "maestro test $PW/reload-graph.yaml" \
  --duration "$RELOAD_MS" --iterationCount 1 \
  --resultsFilePath "flashlight-reload-onboard-connect.json" --record

echo "=== done -> flashlight-onboard-connect.json, flashlight-reload-onboard-connect.json ==="
