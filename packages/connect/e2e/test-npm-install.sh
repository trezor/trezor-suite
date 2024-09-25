#!/usr/bin/env bash

# validate that installing connect package using npm works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm install tslib --save # peer dependency
npm install @trezor/connect@"$1" --save
npm install @trezor/connect-web@"$1" --save

cat package.json

echo "const TrezorConnect = require('@trezor/connect')" >./index.js
node index.js
