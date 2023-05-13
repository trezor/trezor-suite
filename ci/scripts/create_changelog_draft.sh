#!/usr/bin/env bash

# creates changelog draft for package passed in argument

changelog=""

git log --oneline -- ./packages/"$1" | (
    while read -r commit; do
        if [[ $commit == *"release"* ]] &&  [[ $commit == *"@trezor/$1 "* ]];
        then
            echo "${changelog}"
            exit 0
        fi
        line_break=$'\n'
        changelog="${changelog}${commit}${line_break}"
    done
)
