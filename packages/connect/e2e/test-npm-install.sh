#!/usr/bin/env bash

# validate that installing connect package using npm works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm pkg set type=module
npm install tslib --save # peer dependency
npm install @trezor/connect@"$1" --save
npm install @trezor/connect-web@"$1" --save

cat package.json

# ESM smoke: @trezor/connect and its entire closure are ESM-only since v10, must work via import.
printf "import TrezorConnect from '@trezor/connect';\nimport TrezorConnectWeb from '@trezor/connect-web';\nimport { cloneObject } from '@trezor/utils';\nconsole.log('typeof TrezorConnect: '+typeof TrezorConnect);\nconsole.log('typeof TrezorConnectWeb: '+typeof TrezorConnectWeb);\nconsole.log('typeof cloneObject: '+typeof cloneObject);" >./index.mjs
node index.mjs
