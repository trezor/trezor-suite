#!/usr/bin/env bash

# Generic bundle size check.
# Fails if the gzipped tarball of a built folder exceeds MAX_KB.
# Use to detect accidentally bundled heavy dependencies. See issue #8771.
#
# This is a coarse trip-wire for a single-PR size jump, not a slow-creep
# detector: MAX_KB is a fixed ceiling (typically BASELINE_KB * 1.10). After a
# legitimate size increase, bump BASELINE_KB + MAX_KB in the caller (CI
# workflow / release action) in the same PR as the change.
#
# Usage:
#   scripts/check-build-size.sh <label> <target-dir> <baseline-kb> <max-kb>
#
# Example:
#   scripts/check-build-size.sh transport-bridge packages/transport-bridge/dist 171 188

set -euo pipefail

LABEL="${1:-}"
TARGET_DIR="${2:-}"
BASELINE_KB="${3:-}"
MAX_KB="${4:-}"

if [[ -z "$LABEL" || -z "$TARGET_DIR" || -z "$BASELINE_KB" || -z "$MAX_KB" ]]; then
    echo "Usage: $0 <label> <target-dir> <baseline-kb> <max-kb>"
    exit 2
fi

for arg in BASELINE_KB MAX_KB; do
    if [[ ! "${!arg}" =~ ^[0-9]+$ ]]; then
        echo "Error: $arg must be a positive integer (got '${!arg}')"
        exit 2
    fi
done

echo "[${LABEL}] bundle size check"

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ABS_TARGET="$REPO_ROOT/$TARGET_DIR"

if [[ ! -d "$ABS_TARGET" ]]; then
    echo "Error: target folder not found at $ABS_TARGET"
    echo "       Build the package first."
    exit 1
fi

echo "Target:   $TARGET_DIR"
echo "Baseline: ${BASELINE_KB} KB"
echo "Max:      ${MAX_KB} KB"

PARENT_DIR="$( dirname "$ABS_TARGET" )"
FOLDER_NAME="$( basename "$ABS_TARGET" )"
TEMP_DIR="$( mktemp -d -t check-build-size.XXXXXX )"
trap 'rm -rf "$TEMP_DIR"' EXIT
TEMP_TAR="$TEMP_DIR/build.tar.gz"

# gzip -n drops the archive's mtime/name header so identical contents always
# compress to the same size (no timestamp jitter). wc -c counts exact bytes,
# avoiding du's filesystem-block rounding which is coarser than tight limits.
tar -cf - -C "$PARENT_DIR" "$FOLDER_NAME" | gzip -n > "$TEMP_TAR"

SIZE_BYTES="$( wc -c < "$TEMP_TAR" )"
MAX_BYTES=$(( MAX_KB * 1024 ))
SIZE_KB=$(( (SIZE_BYTES + 1023) / 1024 ))

if (( BASELINE_KB > 0 )); then
    DELTA_PCT=$(( (SIZE_KB - BASELINE_KB) * 100 / BASELINE_KB ))
    echo "Measured: ${SIZE_KB} KB (${SIZE_BYTES} bytes, compressed) — ${DELTA_PCT}% vs baseline"
else
    echo "Measured: ${SIZE_KB} KB (${SIZE_BYTES} bytes, compressed)"
fi

if (( SIZE_BYTES > MAX_BYTES )); then
    echo ""
    echo "[${LABEL}] bundle size check FAILED"
    echo "   ${SIZE_KB} KB exceeds limit ${MAX_KB} KB"
    echo "   If this growth is intentional, bump baseline+max in the caller."
    exit 1
fi

echo ""
echo "[${LABEL}] bundle size check PASSED"
echo "   Remaining budget: $(( (MAX_BYTES - SIZE_BYTES) / 1024 )) KB"
