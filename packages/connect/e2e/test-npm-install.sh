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

printf "const TrezorConnect = require('@trezor/connect');\nconst { cloneObject } = require('@trezor/utils');" >./index.cjs
printf "import TrezorConnect from '@trezor/connect';\nimport { cloneObject } from '@trezor/utils';" >./index.mjs
printf "\nconsole.log('typeof TrezorConnect: '+typeof TrezorConnect);\nconsole.log('typeof cloneObject: '+typeof cloneObject);" | tee -a index.cjs index.mjs >/dev/null
node index.cjs
node index.mjs
