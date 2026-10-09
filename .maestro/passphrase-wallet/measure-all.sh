#!/usr/bin/env bash
#
# Measure every passphrase coin variant. Per variant, two separate Flashlight runs:
# the whole passphrase flow, then the warm reload of the persisted state ->
# flashlight-passphrase-<variant>.json + flashlight-reload-<variant>.json.
# (See measure.sh for why they're separate runs.)
#
# Durations (ms): scenario per variant, reload ~15s (measured ~7.5s).
# Tighten after timing with `time maestro test <flow>`.
#
# Prereqs (see .maestro/README.md): user-env up, shim on :9011, develop build installed.
set -euo pipefail

DIR="$(dirname "$0")"

#                  variant       scenario_ms  reload_ms
"$DIR/measure.sh"  sol           120000       15000
"$DIR/measure.sh"  btc           120000       15000
"$DIR/measure.sh"  eth           210000       15000
"$DIR/measure.sh"  btc-eth-sol   135000       15000

echo "=== all variants done — results: flashlight-passphrase-*.json, flashlight-reload-*.json ==="
