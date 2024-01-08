#!/usr/bin/env bash

# validate that installing connect package using yarn works

set -e

# trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version
yarn --version

mkdir connect-implementation
cd connect-implementation
npm init -y
touch yarn.lock

# install connect package
yarn add @trezor/connect
# prepare minimal typescript implementation
echo import TrezorConnect from \"@trezor/connect\" > index.ts

# compile with typescript
yarn add typescript@5.3.2
yarn tsc ./index.ts --types node
