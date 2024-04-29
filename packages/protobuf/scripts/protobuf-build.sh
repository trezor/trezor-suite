#!/usr/bin/env bash

set -euxo pipefail

echo $#

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

BRANCH="main"
DIST="."

if [[ $# -ne 0 && $# -ne 1 ]]
    then
        echo "must provide either 1 or 0 arguments. $# provided"
        exit 1
fi

if [[ $# -eq 1 ]]
    then
        BRANCH=$1
fi

cd ../../../
ls -la
if test -d ./trezor-firmware; then
    echo "trezor-firmware directory exists"
else
    echo "trezor-firmware directory does not exist"
    git clone https://github.com/trezor/trezor-firmware.git
fi

cd trezor-firmware
git checkout "$BRANCH"
git pull origin "$BRANCH"
cd ..

cd "$PARENT_PATH/.."

SRC="../../../trezor-firmware/common/protob"

# BUILD combined messages.proto file from protobuf files
# this code was copied from ./submodules/trezor-common/protob Makekile
# clear protobuf syntax and remove unknown values to be able to work with proto2js
echo 'syntax = "proto2";' > "$DIST"/messages.proto
echo 'import "google/protobuf/descriptor.proto";' >> "$DIST"/messages.proto
echo "Build proto file from $SRC"
grep -hv -e '^import ' -e '^syntax' -e '^package' -e 'option java_' "$SRC"/messages*.proto \
| sed 's/ hw\.trezor\.messages\.common\./ /' \
| sed 's/ common\./ /' \
| sed 's/ ethereum_definitions\./ /' \
| sed 's/ management\./ /' \
| sed 's/^option /\/\/ option /' \
| grep -v '    reserved '>> "$DIST"/messages.proto

# BUILD messages.json from message.proto
# pbjs command is added by protobufjs-cli package
node ../../node_modules/.bin/pbjs -t json -p "$DIST" -o "$DIST"/messages.json --keep-case messages.proto
rm "$DIST"/messages.proto

cd "$PARENT_PATH"

node ./protobuf-types.js typescript

yarn workspace @trezor/protobuf g:prettier --write {messages.json,src/messages.ts} 
yarn workspace @trezor/protobuf g:eslint --fix ./src/messages.ts