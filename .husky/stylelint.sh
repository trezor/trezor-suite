#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m' # No Color

if [ "$TREZOR_PRE_COMMIT_STYLELINT_SKIP" == "true" ]; then
  echo "Skipping Stylelint pre-commit hook, do: 'export TREZOR_PRE_COMMIT_STYLELINT_SKIP=false' to re-enable it."
  exit 0
fi

# Check all staged JavaScript/TypeScript files. The styled syntax ignores files without CSS blocks.
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | grep -E '\.(js|jsx|ts|tsx)$')

echo -e "${GREEN}Running Stylelint pre-commit hook, to disable it do: 'export TREZOR_PRE_COMMIT_STYLELINT_SKIP=true'.${NC}"

# Exit if no files. Passing no arguments would trigger Stylelint for the whole repository.
if [ -z "$STAGED_FILES" ]; then
  echo "No staged JavaScript/TypeScript files to lint."
else
  echo "$STAGED_FILES"
  echo ""

  # No quotes to pass as separate arguments (files)
  # shellcheck disable=SC2086
  if ! yarn stylelint --cache --fix --config .stylelintrc $STAGED_FILES; then
    echo "Stylelint failed! Please fix the errors and try again. You can also use --no-verify to skip pre-commit checks."
    exit 1
  fi

  git update-index --again
fi
