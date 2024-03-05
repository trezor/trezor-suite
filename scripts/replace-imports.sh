#!/usr/bin/env bash

set -euxo pipefail

echo "replacing imports in $1"

# Determine the operating system
OS="$(uname)"

# Execute the appropriate command based on the OS
if [[ "$OS" == "Darwin" ]]; then
    # macOS command with -i '' for in-place editing without backup and -E for extended regex
    find "$1" -type f -exec sed -i '' -E "s/import\(\"@trezor\/([^/]+)\/src/import(\"@trezor\/\1\/lib/g" {} +
else
    # Linux command with -i for in-place editing without backup (GNU sed syntax)
    find "$1" -type f -exec sed -i "s/import\(\"@trezor\/([^/]+)\/src/import(\"@trezor\/\1\/lib/g" {} +
fi
