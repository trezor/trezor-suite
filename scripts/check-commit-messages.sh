#!/usr/bin/env bash

branch_name=$(echo ${GITHUB_REF#refs/heads/})
echo "test: $branch_name"

echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"

echo echo "Remote branch: $(git rev-parse --abbrev-ref origin/HEAD)"

for commit in $(git rev-list origin/develop..HEAD); do

    commit_msg=$(git log --format=%B -n 1 "$commit")

    # Skip validation in case of revert commits
    if echo "$commit_msg" | grep -qE "^Revert"; then
    continue
    fi

    # Check for fixup commits
    if echo "$commit_msg" | grep -qE "^fixup! "; then
    tput setaf 1
    echo -e "Fixup commit validation failed for commit $commit:\n$commit_msg"
    tput sgr0
    echo -e "To squash fixup commits, run:\ngit rebase -i --autosquash origin/HEAD"
    exit 1
    fi

    # Check commit message syntax
    if ! echo "$commit_msg" | grep -qE "^(build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert)(\([a-z, -]+\))?: "; then
    tput setaf 1
    echo -e "Conventional Commits validation failed for commit $commit:\n$commit_msg"
    tput sgr0
    echo "Learn more about Conventional Commits at https://www.conventionalcommits.org"
    exit 1
    fi
done
