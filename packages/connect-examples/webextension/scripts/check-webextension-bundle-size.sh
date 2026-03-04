#!/usr/bin/env bash

set -e

# Baseline: 24 KB (measured on 2026-03-02, prod, compressed)
# MAX_KB: 29 KB (110% of baseline = max allowed growth)
# To update baseline after legitimate changes: measure new compressed size and update both values

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/../../../../" && pwd )"

bash "$REPO_ROOT/scripts/ci/check-bundle-size.sh" "trezor-connect webextension" "$SCRIPT_DIR/../build" 24 29
