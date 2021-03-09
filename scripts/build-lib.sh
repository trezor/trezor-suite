#!/usr/bin/env bash

set -euxo pipefail

# copy source files
rm -rf lib
cp -r src lib

# remove tests and non js files
rm -r lib/flow-test
find lib -type f ! -name '*.js' | xargs -I {} rm {}

# create .flow files
find lib -name '*.js' | xargs -I {} mv {} {}.flow

# build
yarn babel src --out-dir lib
