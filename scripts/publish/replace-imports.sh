#!/usr/bin/env bash

set -euxo pipefail

# Usage:
#   bash replace-imports.sh <directory>
#
# Arguments:
#   <directory>     The path to the directory containing files to modify.
#
# Example:
#   To replace imports in the ./lib directory using the ESM module type:
#     bash replace-imports.sh ./lib

if [ "$#" -ne 1 ]; then
    echo "Error, needs 1 argument. Usage: $0 <directory>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BABEL_CONFIG="$SCRIPT_DIR/babel.config.json"

# Transform .js files using Babel
yarn run -T babel "$1" --out-dir "$1" --extensions ".js" --config-file "$BABEL_CONFIG"

# Determine the operating system
OS="$(uname)"

# Transform .d.ts files using sed
# It should be possible to solve this using babel but babel needs @babel/preset-typescript to parse .d.ts files
# and that preset there is the risk of stripping type declarations, which would break .d.ts files.
# Using sed is faster and it just works.
# Execute the appropriate command based on the OS:
if [[ "$OS" == "Darwin" ]]; then
    # macOS command with -i '' for in-place editing without backup and -E for extended regex.
    find "$1" -name "*.d.ts" -type f -exec sed -i '' "s|@trezor/\([^/]*\)/src|@trezor/\1/lib|g" {} +
else
    # Linux command with -i and -E for in-place editing without backup (GNU sed syntax) and extended regex.
    find "$1" -name "*.d.ts" -type f -exec sed -i "s|@trezor/\([^/]*\)/src|@trezor/\1/lib|g" {} +
fi

# Rename all ESM js files to mjs.
find "$1" -name "*.js" -type f -exec sh -c 'mv "$0" "${0%.js}.mjs"' {} \;
# Rename declaration files to .d.mts so TypeScript treats them as ESM, matching the .mjs runtime files.
find "$1" -name "*.d.ts" -type f -exec sh -c 'mv "$0" "${0%.d.ts}.d.mts"' {} \;
