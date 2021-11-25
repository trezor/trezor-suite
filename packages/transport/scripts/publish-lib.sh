#!/usr/bin/env bash

set -euxo pipefail

# Validate params
if [ -z "$1" ]; then
    echo "Version not provided"
    echo "Use: yarn publish:lib patch|minor|major"
    exit 1
fi

# Validate destination param
if [ "$1" != "patch" ] && [ "$1" != "minor" ] && [ "$1" != "major" ]; then
    echo "Invalid version: "$1
    echo "use: patch|minor|major"
    exit 1
fi

# git-clean:
test ! -n "$$(git status --porcelain)"

# git-ancestor:
git fetch origin
git merge-base --is-ancestor origin/master master

# build
yarn
yarn type-check
yarn lint
yarn build:lib

# publish
npm version $1
npm publish
git push
git push --tags
