#!/bin/bash

GREEN='\033[0;32m'
NC='\033[0m' # No Color

if [ "$TREZOR_PRE_COMMIT_TRANSLATIONS_SKIP" == "true" ]; then
  echo "Skipping translations pre-commit hook, do: 'export TREZOR_PRE_COMMIT_TRANSLATIONS_SKIP=false' to re-enable it."
  exit 0
fi

# Only run the structure check when the mobile translation source is staged.
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | grep -E '^suite-native/intl/src/messages\.ts$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo -e "${GREEN}Running translations structure pre-commit hook, to disable it do: 'export TREZOR_PRE_COMMIT_TRANSLATIONS_SKIP=true'.${NC}"

if ! yarn workspace @suite-native/intl translations:verify-structure; then
  echo "Translation structure check failed! A Crowdin key is either a string or an object, never both,"
  echo "so don't reshape an existing key (e.g. 'generic.cancel' -> 'generic.cancel.ios' or vice versa) - it breaks Crowdin sync."
  echo "Fix: use a fresh key path instead. You can also use --no-verify to skip pre-commit checks."
  exit 1
fi
