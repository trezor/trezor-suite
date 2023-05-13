#!/usr/bin/env bash

# creates changelog draft for package passed in argument

changelog=""

git log --oneline -- ./packages/"$1" | (
    while read -r commit; do
        if [[ $commit == *"npm-release: @trezor/$1 "* ]];
        then
            printf "%s" "${changelog}"
            exit 0
        fi
        changelog=$(printf "%s\n%s" "${changelog}" "${commit}")
    done
)
