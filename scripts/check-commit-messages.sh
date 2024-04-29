#!/usr/bin/env bash

# This script is run by commit-messages-check github action

BASE_BRANCH_NAME="${BASE_BRANCH_NAME:-develop}"

lint_commit_msg() {
  # Skip validation in case of revert commits
  if echo "$commit_msg" | grep -qE "^Revert"; then
    return
  fi

  # Check for fixup commits
  if echo "$commit_msg" | grep -qE "^fixup! "; then
    tput -T linux setaf 1
    echo "Fixup commit validation failed for commit $commit: $commit_msg"
    tput -T linux sgr0
    echo -e "To squash fixup commits, run:\ngit rebase -i --autosquash origin/HEAD"
    exit 1
  fi

  # Check commit message syntax
  if ! echo "$commit_msg" | grep -qE "^(build|ci|docs|feat|fix|perf|refactor|style|test|chore|revert|npm-release|release)(\([a-z, -]+\))?: "; then
    tput -T linux setaf 1
    echo "Conventional Commits validation failed for commit $commit: $commit_msg"
    tput -T linux sgr0
    echo "Learn more about Conventional Commits at https://www.conventionalcommits.org"
    exit 1
  fi
}

lint_commit() {
  commit=$1
  commit_msg=$(git log --format=%B -n 1 "$commit")
  lint_commit_msg $commit_msg
}

if [ ! -z "$LINT_COMMIT_MSG" ]; then
  # passing an explicit messages skips git interactions; for use in commit hook
  lint_commit_msg "$LINT_COMMIT_MSG"
  exit 0
fi

if [ -z "$LINT_COMMITS" ]; then
  # if commit hashes are not passed explicitly, lint history compared to base branch
  if ! git rev-list origin/"$BASE_BRANCH_NAME"..HEAD > /dev/null 2>&1; then
    tput -T linux setaf 1
    echo "git rev-list command failed"
    tput -T linux sgr0
    exit 1
  fi
  LINT_COMMITS=$(git rev-list origin/"$BASE_BRANCH_NAME"..HEAD)
fi


for commit in $LINT_COMMITS; do
  lint_commit $commit
done
