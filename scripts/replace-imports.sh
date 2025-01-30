#!/usr/bin/env bash

set -euxo pipefail

# Usage: 
#   bash replace-imports.sh <directory> [lib-type]
#
# Arguments:
#   <directory>   The path to the directory containing files to modify.
#   [lib-type]    (Optional) The type of library to use. Defaults to "lib" if not provided.
#                 Use "libESM" for ESM libraries.
#
# Example:
#   To replace imports in the ./lib directory using the default library type:
#     bash replace-imports.sh ./lib
#
#   To replace imports in the ./libESM directory using the "libESM" library type:
#     bash replace-imports.sh ./libESM libESM

# By default set to "lib" but when providing second argument it uses it.
if [ $# -ge 2 ]; then
    LIB_TYPE="$2"
else
    LIB_TYPE="lib"
fi

# Set the regex based on the LIB_TYPE argument
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
