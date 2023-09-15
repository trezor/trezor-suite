#!/usr/bin/env bash

# validate that installing connect package using npm works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm install @trezor/connect --save
npm install @trezor/connect-web --save

cat package.json

echo "const TrezorConnect = require('@trezor/connect')" > ./index.js
node index.js

