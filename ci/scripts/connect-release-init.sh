#!/usr/bin/env bash

set -e -o pipefail

DEPS_CHECK_RESULT=$(node ./ci/scripts/check-npm-dependencies.js connect)
DEPS_CHECKLIST=""

DEPS=$(echo ${DEPS_CHECK_RESULT} | jq -r '.deps')
DEPS_ERRORS=$(echo ${DEPS_CHECK_RESULT} | jq -r '.errors')

if [ -z $DEPS ]; then
  echo "no relevant dependencies to be released"
else
  echo "dependencies to be reelased: ${DEPS}"
  IFS=',' read -ra DEPS_ARRAY <<< "${DEPS}"
  DEPS_CHECKLIST=$(for i in "${DEPS_ARRAY[@]}"; do echo "- [ ] [![NPM](https://img.shields.io/npm/v/@trezor/${i}.svg)](https://www.npmjs.org/package/@trezor/${i}) @trezor/${i}"; done)

  # prepare one commit for each dependency with version bump and changelog 
  for i in "${DEPS_ARRAY[@]}";
  do
    yarn bump patch "./packages/${i}/package.json"
    touch -a "./packages/${i}/CHANGELOG.md"
    echo "# $(jq -r '.version' < packages/${i}/package.json)  $(./ci/scripts/create_changelog_draft.sh ${i})  "|cat - packages/${i}/CHANGELOG.md > /tmp/out 
    mv /tmp/out packages/${i}/CHANGELOG.md 
    yarn prettier --write packages/${i}/CHANGELOG.md 
    git add "./packages/${i}" yarn.lock 
    git commit -m "npm-release: @trezor/${i} $(jq -r '.version' < "packages/${i}/package.json")";
  done
fi

# no yarn.lock change should be needed
yarn --immutable

yarn workspace @trezor/connect version:"${1}"
VERSION=$(jq -r '.version' < packages/connect/package.json)
BRANCH_NAME="test-npm-release/connect-${VERSION}"
git checkout -B "${BRANCH_NAME}"
git add . && git commit -m "npm-release: @trezor/connect ${VERSION}" && git push origin "${BRANCH_NAME}" -f
PR_TITLE="npm-release @trezor/connect ${VERSION}"
gh pr create --repo trezor/trezor-suite --title "${PR_TITLE}" --body-file "docs/releases/connect-release.md" --base develop
PR_NUM=$(gh pr list --repo trezor/trezor-suite --head "${BRANCH_NAME}" --json number | jq .[0].number)

if [[ ! -z ${DEPS_ERRORS} ]]; then
  echo "deps error. one of the dependencies likely needs to be published for the first time" 
  echo "deps errors: ${DEPS_ERRORS}"
  gh pr comment "${PR_NUM}" --body "Deps error. one of the dependencies likely needs to be published for the first time: ${DEPS_ERRORS}"
fi

if [[ ! -z ${DEPS_CHECKLIST} ]]; then
  echo "deps checklist: ${DEPS_CHECKLIST}"
  gh pr comment "${PR_NUM}" --body "${DEPS_CHECKLIST}"
fi

echo "DONE"
