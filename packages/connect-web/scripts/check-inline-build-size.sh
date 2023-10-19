#!/usr/bin/env bash

set -e

echo "trezor-connect.js size check"

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

du -h "$parent_path/../build/trezor-connect.js"

SIZE_S=$(du -s "$parent_path/../build/trezor-connect.js" | cut -f1)
# at time of creating this script size was 320
# if you have considerably more, there is a chance that you accidentally included
# parts of code that shouldn't be in this build.
if [[ "$SIZE_S" -gt 400 ]]
then
    echo "suspiciously large build detected!"
    exit 1;
else
    echo "size seems ok"
fi

