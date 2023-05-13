#!/usr/bin/env bash

# creates changelog draft for package passed in argument

changelog=""
# line_break=$'\n'

git log --oneline -- ./packages/"$1" | (
    while read -r commit; do
        if [[ $commit == *"npm-release: @trezor/$1 "* ]];
        then
            printf "${changelog}"
            exit 0
        fi
        changelog="${changelog}\n${commit}"
    done
)
