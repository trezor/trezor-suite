#!/usr/bin/env bash

set -e

# Configuration parameters
# Baseline: 24 KB (measured on 2026-03-02, prod, compressed)
# MAX_KB: 29 KB (110% of baseline = max allowed growth)
# To update baseline after legitimate changes: measure new compressed size and update both values

BASELINE_KB=24
MAX_KB=${MAX_KB:-29}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_FOLDER="$SCRIPT_DIR/../build"

bash "$SCRIPT_DIR/../../../../scripts/ci/check-bundle-size.sh" \
    "trezor-connect webextension" \
    "$BUILD_FOLDER" \
    "$BASELINE_KB" \
    "$MAX_KB"
