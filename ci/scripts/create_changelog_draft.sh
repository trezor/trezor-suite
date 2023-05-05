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
        changelog="${changelog}${commit}'\n'"
    done

    # "commit message containing something like 'release: @trezor/$1' in 'git log --oneline -- ./packages/$1' was not found  "
)
