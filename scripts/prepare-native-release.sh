#!/usr/bin/env bash

# Run this script to freeze development of the next suite-native version.
# Prepare release branch, push it to the release repository, bump package.json for the next release, and create a pull requests.
# You need to have the permission to push to protected branches in order to execute the script correctly.
# For security reasons, the script can only run locally as we do not have a shared GitHub token with the necessary permissions.

MAIN_BRANCH=develop
PACKAGE_JSON_PATH=suite-native/app/package.json
ORIGIN='origin'

if ! git diff --cached --quiet; then
  tput setaf 1
  echo "There are potentially unrelated staged changes that should not be committed. Unstage them before running this script."
  tput sgr0
  exit 1
fi

if ! git diff --quiet $PACKAGE_JSON_PATH; then
  tput setaf 1
  echo "There are potentially unrelated unstaged changes in $PACKAGE_JSON_PATH that should not be committed. Stash the changes before running this script."
  tput sgr0
  exit 1
fi

# 1. CREATE RELEASE BRANCH WITH CURRENT VERSION
echo Calculating versions...
YEAR=$(date +%y)
MONTH=$(date +%-m)

CURRENT_VERSION="$(grep -m1 -o '\"suiteNativeVersion\": *\"[^\"]*\"' $PACKAGE_JSON_PATH | cut -d':' -f2- | tr -d '\" ')"
echo "Current version found in $PACKAGE_JSON_PATH: $CURRENT_VERSION"

echo Pulling "$MAIN_BRANCH"...
git pull $MAIN_BRANCH

RELEASE_BRANCH_NAME="release-native/$CURRENT_VERSION"

git switch -c "$RELEASE_BRANCH_NAME" $MAIN_BRANCH
git push --set-upstream $ORIGIN "$RELEASE_BRANCH_NAME"


# 2. BUMP VERSION IN PACKAGE.JSON FOR THE FUTURE RELEASE AND PUSH IT
CURRENT_VERSION_YEAR=$(echo "$CURRENT_VERSION" | cut -d '.' -f 1)
CURRENT_VERSION_MONTH=$(echo "$CURRENT_VERSION" | cut -d '.' -f 2)
CURRENT_VERSION_MINOR=$(echo "$CURRENT_VERSION" | cut -d '.' -f 3)

if [ "$CURRENT_VERSION_MONTH" != "$MONTH" ]; then
  # increment month and set minor version to 1
  NEXT_VERSION="$YEAR.$MONTH.1"
else
  # increment minor version
  NEXT_VERSION="$CURRENT_VERSION_YEAR.$CURRENT_VERSION_MONTH.$((CURRENT_VERSION_MINOR+1))"
fi

echo "Version of the next release: $NEXT_VERSION"

BUMP_VERSION_BRANCH_NAME="chore/native/bump-app-version-to-$NEXT_VERSION"

git switch -c "$BUMP_VERSION_BRANCH_NAME" $MAIN_BRANCH 
sed -i '' -E "s/(\"suiteNativeVersion\": \")[^\"]*(\".*)/\1$NEXT_VERSION\2/" $PACKAGE_JSON_PATH
yarn format --fix
git add $PACKAGE_JSON_PATH
git commit -m "chore(suite-native): bump suite-native version to $NEXT_VERSION"
git push --set-upstream $ORIGIN "$BUMP_VERSION_BRANCH_NAME"
