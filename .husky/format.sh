#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m' # No Color

if [ "$TREZOR_PRE_COMMIT_FORMAT_SKIP" == "true" ]; then
  echo "Skipping format pre-commit hook, do: 'export TREZOR_PRE_COMMIT_FORMAT_SKIP=false' to re-enable it."
  exit 0
fi

# Get staged files that prettier can format (excluding deleted files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | grep -E '\.(js|jsx|ts|tsx|md|mdx|html|json|yml|yaml)$')

echo -e "${GREEN}Running prettier pre-commit hook, to disable it do: 'export TREZOR_PRE_COMMIT_FORMAT_SKIP=true'.${NC}"

# Exit if no files. Passing no arguments would format the whole repo.
if [ -z "$STAGED_FILES" ]; then
  echo "No staged files to format."
else
  echo "$STAGED_FILES"
  echo ""

  if ! echo "$STAGED_FILES" | xargs ./node_modules/.bin/prettier --write; then
    echo "prettier --write failed! Please fix the errors and try again. You can also use --no-verify to skip pre-commit checks."
    exit 1
  fi

  # Only re-stage if format:write actually changed files
  REFORMATTED=$(echo "$STAGED_FILES" | xargs git diff --name-only --)
  if [ -n "$REFORMATTED" ]; then
    git update-index --again
  fi
fi
