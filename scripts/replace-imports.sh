#!/usr/bin/env bash

set -euxo pipefail

if [ $# -ge 2 ]; then
    LIB_TYPE="$2"
else
    LIB_TYPE="lib"  # Default value
fi

# Set the regex based on the LIB_TYPE argument
if [[ "$LIB_TYPE" == "libESM" ]]; then
    REGEX="s/@trezor\/([^/]+)\/src/@trezor\/\1\/libESM/g"
else
    REGEX="s/@trezor\/([^/]+)\/src/@trezor\/\1\/lib/g"
fi

if [[ "$LIB_TYPE" == "libESM" ]]; then
    REGEX="s/@trezor\/([^/]+)\/src/@trezor\/\1\/libESM/g"
else
    REGEX="s/@trezor\/([^/]+)\/src/@trezor\/\1\/lib/g"
fi

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
