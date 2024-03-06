#!/usr/bin/env bash

set -euxo pipefail

echo "Replacing imports from @trezor/*/src to @trezor/*/lib in folder $1"

# Determine the operating system
OS="$(uname)"

# Execute the appropriate command based on the OS
if [[ "$OS" == "Darwin" ]]; then
    # macOS command with -i '' for in-place editing without backup and -E for extended regex
    # Removes the "import(" part from the search pattern and replaces @trezor/*/src with @trezor/*/lib
    find "$1" -type f -exec sed -i '' -E "s/@trezor\/([^/]+)\/src/@trezor\/\1\/lib/g" {} +
else
    # Linux command with -i for in-place editing without backup (GNU sed syntax)
    # Similar adjustment as for macOS
    find "$1" -type f -exec sed -i "s/@trezor\/([^/]+)\/src/@trezor\/\1\/lib/g" {} +
fi
