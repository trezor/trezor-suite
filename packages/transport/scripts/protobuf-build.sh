#!/usr/bin/env bash

set -euxo pipefail

echo $#

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

SRC="../../submodules/trezor-common/protob"
DIST="."
LANG="typescript"

if [[ $# -ne 0 && $# -ne 3 ]]
    then
        echo "must provide either 3 or 0 arguments. $# provided"
        exit 1
fi

if [[ $# -eq 3 ]]
    then
        SRC=$1
        DIST=$2
        LANG=$3
fi

if [[ "$LANG" != "typescript" && "$LANG" != "flow" ]];
    then
        echo "either typescript or flow must be specified as the third argument"
        exit 1
fi


# BUILD combined messages.proto file from protobuf files
# this code was copied from ./submodules/trezor-common/protob Makekile
# clear protobuf syntax and remove unknown values to be able to work with proto2js
echo 'syntax = "proto2";' > $DIST/messages.proto
echo 'import "google/protobuf/descriptor.proto";' >> $DIST/messages.proto
echo "Build proto file from $SRC"
grep -hv -e '^import ' -e '^syntax' -e '^package' -e 'option java_' $SRC/messages*.proto \
| sed 's/ hw\.trezor\.messages\.common\./ /' \
| sed 's/ common\./ /' \
| sed 's/ management\./ /' \
| sed 's/^option /\/\/ option /' \
| grep -v '    reserved '>> $DIST/messages.proto

# BUILD messages.json from message.proto
node_modules/.bin/pbjs -t json -p $DIST -o $DIST/messages.json --keep-case messages.proto
rm $DIST/messages.proto

echo "generating type definitions for: $LANG"

cd "$PARENT_PATH"

node ./protobuf-types.js $LANG

yarn prettier --write messages.json
yarn prettier --write **/messages.ts
