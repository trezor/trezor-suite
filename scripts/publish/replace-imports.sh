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
else
    BABEL_CONFIG="$SCRIPT_DIR/babel.config.cjs.json"
fi

yarn run -T babel "$1" --out-dir "$1" --extensions ".js" --config-file "$BABEL_CONFIG"
