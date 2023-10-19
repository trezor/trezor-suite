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
touch yarn.lock
yarn add @trezor/connect
yarn add @trezor/connect-web