#!/usr/bin/env bash
for commit in $(git rev-list origin/HEAD..HEAD); do

    commit_msg=$(git log --format=%B -n 1 "$commit")

    # Skip validation in case of fixup and revert commits
    if echo "$commit_msg" | grep -qE "^(Revert|fixup! )"; then
    continue
    fi

    if ! echo "$commit_msg" | grep -qE "^(build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert)(\([a-z, -]+\))?: "; then
    echo "Conventional Commits validation failed for commit $commit: $commit_msg"
    exit 1
    fi
done
