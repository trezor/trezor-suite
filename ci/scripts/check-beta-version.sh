#!/usr/bin/env bash

VERSION=$(jq -r .version packages/connect/package.json)

[[ "$VERSION" != *"beta"* ]]

if [ $? -eq 0 ]; then
    echo "Not a beta version, all good."
    exit 0

else
    echo "FAIL! package.json contains beta version!" >&2

    exit 1
fi
