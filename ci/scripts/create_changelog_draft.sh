#!/usr/bin/env bash

# creates changelog draft for package passed in argument
set -e

changelog=""
line_break="§"

git log --oneline -- "./packages/${1}" | (
    while read -r commit; do
        if [[ $commit == *"npm-release: @trezor/${1}"* ]];
        then
            echo "${changelog}"
            exit 0
        fi
        changelog="${changelog}${commit}${line_break}"
    done
)
