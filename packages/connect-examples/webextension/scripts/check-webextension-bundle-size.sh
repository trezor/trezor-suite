#!/usr/bin/env bash

set -e

echo "trezor-connect webextension bundle size check"

# Configuration parameters
# Baseline: 16 KB (measured on 2026-04-02, migration-to-connect-common branch, compressed)
# MAX_KB: 18 KB (~110% of baseline = max allowed growth)
# To update baseline after legitimate changes: measure new compressed size and update both values

BASELINE_KB=16
MAX_KB=${MAX_KB:-18}

# Get script directory and build folder
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_FOLDER="$SCRIPT_DIR/../build"

# Check for build folder
if [[ ! -d "$BUILD_FOLDER" ]]; then
    echo "Error: 'build' folder not found at $BUILD_FOLDER"
    exit 1
fi

echo "Build folder: $BUILD_FOLDER"
echo "Baseline size: ${BASELINE_KB} KB"
echo "Size limit (110% buffer): ${MAX_KB} KB"

# Create temporary tarball
TEMP_TAR="/tmp/connect-examples-webextension-$$.tar.gz"
trap 'rm -f "$TEMP_TAR"' EXIT

# Create compressed tarball
tar -czf "$TEMP_TAR" -C "$SCRIPT_DIR/.." "build" || {
    echo "Error: Failed to create tarball from $BUILD_FOLDER"
    exit 1
}

# Get compressed size in KB
SIZE_KB=$(du -k "$TEMP_TAR" | cut -f1)

echo "Compressed size: ${SIZE_KB} KB"

# Check if size exceeds limit
if (( $(echo "$SIZE_KB > $MAX_KB" | bc -l) )); then
    echo ""
    echo "❌ Bundle size check FAILED"
    echo "   Current size (${SIZE_KB} KB) exceeds limit (${MAX_KB} KB)"
    echo "   This may indicate that heavy dependencies have been added to @trezor/connect-examples"
    echo "   If this is intentional, increase MAX_KB"
    exit 1
else
    echo ""
    echo "✓ Bundle size check PASSED"
    echo "   Remaining budget: $(echo "$MAX_KB - $SIZE_KB" | bc) KB"
    exit 0
fi
