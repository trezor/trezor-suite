#!/usr/bin/env bash

set -e

# Common bundle size check script
# Usage: check-bundle-size.sh <description> <build-folder> <baseline-kb> <max-kb>
# Arguments:
#   $1: Description (e.g., "suite-desktop core bundle")
#   $2: Build folder path (absolute or relative)
#   $3: Baseline size in KB (informational, for reference)
#   $4: Max allowed compressed size in KB (can also be overridden via MAX_KB env var)

DESCRIPTION="${1:?'Description argument is required'}"
BUILD_FOLDER="${2:?'Build folder argument is required'}"
BASELINE_KB="${3:?'Baseline KB argument is required'}"
MAX_KB="${MAX_KB:-${4:?'Max KB argument is required'}}"

echo "${DESCRIPTION} bundle size check"

# Check for build folder
if [[ ! -d "$BUILD_FOLDER" ]]; then
    echo "Error: build folder not found at $BUILD_FOLDER"
    exit 1
fi

echo "Build folder: $BUILD_FOLDER"
echo "Baseline size: ${BASELINE_KB} KB"
echo "Size limit (110% buffer): ${MAX_KB} KB"

# Create temporary tarball
TEMP_TAR=$(mktemp /tmp/bundle-size-check-XXXXXX.tar.gz)
trap 'rm -f "$TEMP_TAR"' EXIT

# Create compressed tarball
BUILD_DIR=$(dirname "$BUILD_FOLDER")
BUILD_NAME=$(basename "$BUILD_FOLDER")
tar -czf "$TEMP_TAR" -C "$BUILD_DIR" "$BUILD_NAME" || {
    echo "Error: Failed to create tarball from $BUILD_FOLDER"
    exit 1
}

# Get compressed size in KB
SIZE_KB=$(du -k "$TEMP_TAR" | cut -f1)

echo "Compressed size: ${SIZE_KB} KB"

# Check if size exceeds limit
if (( SIZE_KB > MAX_KB )); then
    echo ""
    echo "❌ Bundle size check FAILED"
    echo "   Current size (${SIZE_KB} KB) exceeds limit (${MAX_KB} KB)"
    echo "   This may indicate that heavy dependencies have been unexpectedly bundled."
    echo "   If this is intentional, update BASELINE_KB and MAX_KB in the calling script."
    exit 1
else
    echo ""
    echo "✓ Bundle size check PASSED"
    echo "   Remaining budget: $(( MAX_KB - SIZE_KB )) KB"
    exit 0
fi
