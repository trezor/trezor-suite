#!/usr/bin/env bash

fail=0

git fetch origin develop

# list all commits between HEAD and develop
for commit in $(git rev-list origin/develop..)
do
    message=$(git log -n1 --format=%B "$commit")
    echo "Checking $commit"

    # The commit message must contain either
    # 1. "cherry-picked from [some commit in develop]"
    # shellcheck disable=SC2076
    if [[ $message =~ "(cherry picked from commit" ]]; then
      # remove last ")" and extract commit hash
      develop_commit=$(echo "${message:0:-1}" | tr ' ' '\n' | tail -1)
      # check if develop really contains this commit hash
      if [[ $(git branch -a --contains "$develop_commit" | grep --only-matching "remotes/origin/develop") == "remotes/origin/develop" ]]; then
        continue
      fi
    fi

    # 2. [RELEASE ONLY] substring
    # shellcheck disable=SC2076
    if [[ $message =~ "[RELEASE ONLY]" ]]; then
      continue
    fi

    fail=1
    echo "FAILURE! Neither 'cherry picked from..' nor '[RELEASE ONLY]' substring found in this commit message."
done

echo "ALL OK"
exit $fail
