#!/usr/bin/env bash

# Validate that installing locally-packed @trezor/connect* tarballs works for
# each consumer shape covered by fixtures/.

set -e

PACKED_PACKAGES_DIR="${1:-tmp/packed-packages}"

if [ ! -d "$PACKED_PACKAGES_DIR" ]; then
    echo "Error: Packed packages directory not found: $PACKED_PACKAGES_DIR"
    echo "Usage: $0 [path-to-packed-packages]"
    exit 1
fi

PACKED_PACKAGES_DIR="$(cd "$PACKED_PACKAGES_DIR" && pwd)"
echo "Using packed packages from: $PACKED_PACKAGES_DIR"

OVERRIDES_FILE="$PACKED_PACKAGES_DIR/overrides.json"
if [ ! -f "$OVERRIDES_FILE" ]; then
    echo "Error: overrides.json not found: $OVERRIDES_FILE"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/helpers.sh"

TEST_ROOT="$(mktemp -d -t connect-install-smoke-local.XXXXXX)"
trap 'rm -rf "$TEST_ROOT"' EXIT

cd "$TEST_ROOT"
npm --version
node --version

export PACKED_PACKAGES_DIR
export OVERRIDES_FILE

run_install_smoke connect local type-check runtime
run_install_smoke connect-web local type-check runtime
run_install_smoke connect-mobile local type-check runtime
run_install_smoke connect-webextension local runtime

echo ""
echo "All local install-smoke fixtures passed."
