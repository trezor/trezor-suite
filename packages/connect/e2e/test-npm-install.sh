#!/usr/bin/env bash

# validate that installing connect package using npm works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm install @trezor/connect
npm install @trezor/connect-web

echo "import TrezorConnect from '@trezor/connect'" > ./index.js
node index.js

cat package.json
