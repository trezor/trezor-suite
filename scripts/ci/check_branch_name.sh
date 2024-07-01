#!/usr/bin/env bash

echo "branch name:"
echo "$1"

if [[ $1 == *"@"* || $1 == *"#"* ]]; then
  # having @ in branch name is causing some problems with deploy and test jobs
  echo "bad branch name. please remove @ or # from your branch name"
  exit 1
fi

echo "good branch name"
