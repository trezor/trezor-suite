#!/usr/bin/env bash

# creates changelog draft for package passed in argument
set -x -o pipefail

changelog=""

git log --oneline -- ./packages/"$1" | (
    while read -r commit; do
        if [[ $commit == *"npm-release: @trezor/$1 "* ]];
        then
            echo "${changelog}"
            exit 0
        fi
        changelog=$(printf "%s\n%s" "${changelog}" "${commit}")
    done
)
