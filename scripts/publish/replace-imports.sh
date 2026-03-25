#!/usr/bin/env bash

set -euxo pipefail

# Usage:
#   bash replace-imports.sh <directory> [module-type]
#
# Arguments:
#   <directory>     The path to the directory containing files to modify.
#   <module-type>   (Optional) The module system to use: "cjs" | "esm"
#
# Example:
#   To replace imports in the ./lib directory using the CJS module type:
#     bash replace-imports.sh ./lib cjs
#
#   To replace imports in the ./libESM directory using the ESM module type:
#     bash replace-imports.sh ./libESM esm

if [ "$#" -ne 2 ]; then
    echo "Error, needs 2 arguments. Usage: $0 <directory> <module-type>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$2" == "esm" ]; then
    BABEL_CONFIG="$SCRIPT_DIR/babel.config.esm.json"
    LIB_DIR="libESM"
else
    BABEL_CONFIG="$SCRIPT_DIR/babel.config.cjs.json"
    LIB_DIR="lib"
fi

# Transform .js files using Babel
yarn run -T babel "$1" --out-dir "$1" --extensions ".js" --config-file "$BABEL_CONFIG"

# Determine the operating system
OS="$(uname)"

# Transform .d.ts files using sed
# It should be possible to solve this using babel but babel needs @babel/preset-typescript to parse .d.ts files
# and that preset there is the risk of stripping type declarations, which would break .d.ts files.
# Using sed is faster and it just works.
 # Execute the appropriate command based on the OS 
 if [[ "$OS" == "Darwin" ]]; then
    # macOS command with -i '' for in-place editing without backup and -E for extended regex 
    find "$1" -name "*.d.ts" -type f -exec sed -i '' "s|@trezor/\([^/]*\)/src|@trezor/\1/${LIB_DIR}|g" {} +
else
    # Linux command with -i and -E for in-place editing without backup (GNU sed syntax) and extended regex 
    find "$1" -name "*.d.ts" -type f -exec sed -i "s|@trezor/\([^/]*\)/src|@trezor/\1/${LIB_DIR}|g" {} +
fi

if [ "$2" == "esm" ]; then
    # rename all esm js files to mjs
    find "$1" -name "*.js" -type f -exec sh -c 'mv "$0" "${0%.js}.mjs"' {} \;
    find "$1" -name "*.js.map" -type f -exec sh -c 'mv "$0" "${0%.js.map}.mjs.map"' {} \;
    # rename declaration files to .d.mts so TypeScript treats them as ESM, matching the .mjs runtime files
    find "$1" -name "*.d.ts.map" -type f -exec sh -c 'mv "$0" "${0%.d.ts.map}.d.mts.map"' {} \;
    find "$1" -name "*.d.ts" -type f -exec sh -c 'mv "$0" "${0%.d.ts}.d.mts"' {} \;
fi
