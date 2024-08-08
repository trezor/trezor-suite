#!/usr/bin/env bash

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )

cd "$PARENT_PATH/../files/firmware" || exit

for dir in */ ; do
    if [ -d "$dir" ]; then
        if ! "$PARENT_PATH/check-firmware-revisions.sh" "${dir%/}" ; then
            exit 1
        fi;
    fi
done
