#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m' # No Color

if [ "$TREZOR_PRE_COMMIT_ESLINT_SKIP" == "true" ]; then
  echo "Skipping eslint pre-commit hook, do: 'export TREZOR_PRE_COMMIT_ESLINT_SKIP=false' to re-enable it."
  exit 0
fi

# This check will get all staged files that are *.js(x)/*.ts(x) files
# and run eslint on them and tries to fix them and re-add them to be committed.
# If auto-fix is possible it shall be transparent for the user.
# If some error are not fixable, the script will fail and the user will have to fix them manually.

STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | grep '(\.js\|\.jsx$\|\.ts\|\.tsx)$')

echo -e "${GREEN}Running Eslint pre-commit hook, to disable it do: 'export TREZOR_PRE_COMMIT_ESLINT_SKIP=true'.${NC}"

# Exit if no files. Passing no arguments would trigger eslint for whole repo
if [ -z "$STAGED_FILES" ]; then
  echo "No staged JavaScript/TypeScript files to lint."
else
  echo "$STAGED_FILES"
  echo ""

  # No quotes to pass as separate arguments (files)
  # shellcheck disable=SC2086
  if ! yarn lint:js:fix-files $STAGED_FILES; then
    echo "Eslint failed! Please fix the errors and try again. You can also use --no-verify to skip pre-commit checks."
    exit 1
  fi

  git update-index --again
fi


