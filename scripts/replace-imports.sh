#!/usr/bin/env bash

set -euxo pipefail

echo replacing imports in "$1"

find "$1" -type f -exec sed -i '' "s/import(\"packages/import(\"@trezor/g" {} +
