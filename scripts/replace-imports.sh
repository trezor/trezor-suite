#!/usr/bin/env bash

set -euxo pipefail

REGEX="s/@trezor\/([^/]+)\/src/@trezor\/\1\/lib/g"

# Determine the operating system
OS="$(uname)"

# Execute the appropriate command based on the OS
if [[ "$OS" == "Darwin" ]]; then
    # macOS command with -i '' for in-place editing without backup and -E for extended regex
    find "$1" -type f -exec sed -i '' -E "$REGEX" {} +
else
    # Linux command with -i and -E for in-place editing without backup (GNU sed syntax) and extended regex
    find "$1" -type f -exec sed -i -E "$REGEX" {} +
fi

# Safety check to ensure that all occurrences of '@trezor/*/src' have been replaced
SEARCH_PATTERN="@trezor\/[^/]+\/src"
if grep -Rl "$SEARCH_PATTERN" "$1"; then
    echo "Error: Some files still contain '@trezor/*/src'. Please review the replacements."
    exit 1
else
    echo "All occurrences of '@trezor/*/src' have been successfully replaced."
fi

# Patch for Typebox import issue, where TS uses an ESM import path, but our package is CommonJS
# @sinclair/typebox/build/esm/index.mjs -> @sinclair/typebox

REGEX="s/@sinclair\/typebox\/build\/esm\/index.mjs/@sinclair\/typebox/g"

if [[ "$OS" == "Darwin" ]]; then
    find "$1" -type f -exec sed -i '' -E "$REGEX" {} +
else
    find "$1" -type f -exec sed -i -E "$REGEX" {} +
fi
