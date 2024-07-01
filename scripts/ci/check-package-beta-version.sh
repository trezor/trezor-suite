#!/usr/bin/env bash

VERSION=$(jq -r .version package.json)

if [[ "$VERSION" != *"beta"* ]];
then
    echo "FAIL! package.json contains beta version!" >&2
    exit 1
fi

echo "Not a beta version, all good."
exit 0
