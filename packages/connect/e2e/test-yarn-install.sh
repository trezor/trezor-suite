#!/usr/bin/env bash

# validate that installing connect package using yarn works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version
yarn --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm pkg set type=module
touch yarn.lock

echo "npmMinimalAgeGate: 0" > .yarnrc.yml

# install connect package
yarn add @trezor/connect@"$1"
# prepare minimal typescript implementation
echo import TrezorConnect from \"@trezor/connect\" >index.ts

# compile with typescript — @trezor/connect is ESM-only since v10, so use NodeNext.
yarn add typescript@5.8.3 @types/node@22.13.10
yarn tsc ./index.ts --types node,w3c-web-usb --esModuleInterop --target ES2024 --module NodeNext --moduleResolution NodeNext
