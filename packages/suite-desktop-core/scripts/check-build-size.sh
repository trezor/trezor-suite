#!/usr/bin/env bash

set -e

# Configuration parameters
# Baseline: 7000 KB (estimated 2026-03-04 from CI logs, prod, compressed, includes source maps)
# MAX_KB: 7700 KB (110% of baseline = max allowed growth)
# To update baseline after legitimate changes: measure new compressed size and update both values

BASELINE_KB=7000
MAX_KB=${MAX_KB:-7700}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_FOLDER="$SCRIPT_DIR/../../../suite-desktop/dist"

bash "$SCRIPT_DIR/../../../scripts/ci/check-bundle-size.sh" \
    "suite-desktop core" \
    "$BUILD_FOLDER" \
    "$BASELINE_KB" \
    "$MAX_KB"
