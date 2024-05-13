#!/usr/bin/env bash

set -euxo pipefail

echo $#

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

BRANCH="main"
DIST="."
REPO_DIR_NAME="trezor-firmware-probuf-update"

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
if test -d ./$REPO_DIR_NAME; then
    echo "$REPO_DIR_NAME directory exists"
else
    echo "$REPO_DIR_NAME directory does not exist"
    git clone https://github.com/trezor/trezor-firmware.git $REPO_DIR_NAME
fi

cd $REPO_DIR_NAME
git fetch origin
git checkout "$BRANCH"
git reset "origin/$BRANCH" --hard
cd ..

cd "$PARENT_PATH/.."

SRC="../../../$REPO_DIR_NAME/common/protob"

# BUILD combined messages.proto file from protobuf files
# this code was copied from ./submodules/trezor-common/protob Makekile
# clear protobuf syntax and remove unknown values to be able to work with proto2js
echo 'syntax = "proto2";' > "$DIST"/messages.proto
echo 'import "google/protobuf/descriptor.proto";' >> "$DIST"/messages.proto
echo "Build proto file from $SRC"
# NOTE: grep sorting is not cross platform deterministic, make sure that the content of messages.proto ("Message_Type") is at the end of the generated file
grep -hv -e '^import ' -e '^syntax' -e '^package' -e 'option java_' "$SRC"/messages-*.proto "$SRC"/messages.proto \
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