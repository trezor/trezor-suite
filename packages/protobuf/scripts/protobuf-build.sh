#!/usr/bin/env bash

set -euxo pipefail

echo $#

get_abs_path() {
  echo "$( cd -- "$(dirname "$1")" >/dev/null 2>&1 ; pwd -P )"
}

SCRIPTS_PATH=$(get_abs_path "${BASH_SOURCE[0]}")

REPO_BRANCH="main"
REPO_PATH=$(get_abs_path "$SCRIPTS_PATH/../../../../.")/trezor-firmware-probuf-update

if [[ $# -ne 0 && $# -ne 1 ]]
    then
        echo "must provide either 1 or 0 arguments. $# provided"
        exit 1
fi

if [[ $# -eq 1 ]]
    then
        REPO_BRANCH=$1
fi

if test -d "$REPO_PATH"; then
    echo "$REPO_PATH directory exists"
else
    echo "$REPO_PATH directory does not exist"
    git clone https://github.com/trezor/trezor-firmware.git "$REPO_PATH"
fi

cd "$REPO_PATH"
git fetch origin
git checkout "$REPO_BRANCH"
git reset "origin/$REPO_BRANCH" --hard
cd ..

cd "$SCRIPTS_PATH"

# copy proto files to monorepo context
rm -rf ./build
mkdir -p ./build
cp  "$REPO_PATH"/common/protob/*.proto ./build

# remove unused files
rm -f ./build/messages-{webauthn,benchmark,nem,nostr}.proto

# build `protobufjs` definitions and types
yarn g:tsx ./protobuf-definitions.ts ./build --skip=thp

yarn workspace @trezor/protobuf g:prettier --write messages.json

yarn g:tsx ./protobuf-thp-definitions.ts ./build

# build `@bufbuild`` definitions
buf generate
cd ..

# clear all generated comments and empty lines
perl -0777 -pi -e 's{/\*.*?\*/}{}gs; s/^\s*\n//mg' src/definitions/*.js

yarn workspace @trezor/protobuf g:eslint --fix src/definitions/*
yarn workspace @trezor/protobuf g:prettier --write src/definitions/*

mv src/definitions/messages-thp_types.ts ../protocol/src/protocol-thp/messages/protobufTypes.ts
