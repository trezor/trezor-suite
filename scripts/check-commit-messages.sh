#!/usr/bin/env bash

if ! git rev-list "$BASE_BRANCH_NAME".."$CURRENT_BRANCH_NAME"; then
  tput -T linux setaf 1
  echo "git rev-list command failed"
  tput -T linux sgr0
  exit 1
fi

for commit in $(git rev-list "$BASE_BRANCH_NAME".."$CURRENT_BRANCH_NAME"); do

    commit_msg=$(git log --format=%B -n 1 "$commit")

    # Skip validation in case of revert commits
    if echo "$commit_msg" | grep -qE "^Revert"; then
    continue
    fi

    # Check for fixup commits
    if echo "$commit_msg" | grep -qE "^fixup! "; then
    tput -T linux setaf 1
    echo "Fixup commit validation failed for commit $commit:"
    echo "$commit_msg"
    tput -T linux sgr0
    echo -e "To squash fixup commits, run:\ngit rebase -i --autosquash origin/HEAD"
    exit 1
    fi

    # Check commit message syntax
    if ! echo "$commit_msg" | grep -qE "^(build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert)(\([a-z, -]+\))?: "; then
    tput -T linux setaf 1
    echo "Conventional Commits validation failed for commit $commit:"
    echo "$commit_msg"
    tput -T linux sgr0
    echo "Learn more about Conventional Commits at https://www.conventionalcommits.org"
    exit 1
    fi
done
