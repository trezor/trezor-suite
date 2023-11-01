#!/usr/bin/env bash

# Prepare release and testing branches before Suite freeze, bump beta version, and create a pull request.
# You need to have the permission to push to pretected branches in order to execute the script correctly.
# For security reasons, the script can only run locally as we do not have a shared GitHub token with the necessary permissions.
# If you want the script to automatically create a pull request to bump beta version, install and set up gh tool:
# brew install gh
# gh auth login

MAIN_BRANCH=develop
FILEPATH=packages/suite/package.json

if ! git diff --cached --quiet; then
  tput setaf 1
  echo "There are potentially unrelated staged changes that should not be committed. Unstage them before running this script."
  tput sgr0
  exit 1
fi

if ! git diff --quiet $FILEPATH; then
  tput setaf 1
  echo "There are potentially unrelated unstaged changes in $FILEPATH that should not be committed. Stash the changes before running this script."
  tput sgr0
  exit 1
fi

echo Calculating versions...
CURRENT_VERSION=$(grep -m1 -o '\"suiteVersion\": *\"[^\"]*\"' $FILEPATH | cut -d':' -f2- | tr -d '\" ')
CURRENT_VERSION_YEAR=$(echo "$CURRENT_VERSION" | cut -d '.' -f 1)
CURRENT_VERSION_MONTH=$(echo "$CURRENT_VERSION" | cut -d '.' -f 2)

RELEASE_MONTH="$CURRENT_VERSION_YEAR.$CURRENT_VERSION_MONTH"
RELEASE_VERSION="$RELEASE_MONTH.1"
TEST_UPGRADE_VERSION="$((CURRENT_VERSION_YEAR+10)).$CURRENT_VERSION_MONTH.1"
TEST_DOWNGRADE_VERSION="0.$CURRENT_VERSION_YEAR.$CURRENT_VERSION_MONTH"
if [ "$CURRENT_VERSION_MONTH" == 12 ]; then
  NEXT_VERSION_YEAR="$((CURRENT_VERSION_YEAR+1))"
  NEXT_VERSION_MONTH=1
else
  NEXT_VERSION_YEAR=$CURRENT_VERSION_YEAR
  NEXT_VERSION_MONTH="$((CURRENT_VERSION_MONTH+1))"
fi
  BETA_VERSION="$NEXT_VERSION_YEAR.$NEXT_VERSION_MONTH.0"

echo Pulling "$MAIN_BRANCH"...
git pull origin $MAIN_BRANCH

echo Creating release branch "$RELEASE_MONTH"...
git switch -c release/"$RELEASE_MONTH" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*)/\1$RELEASE_VERSION\2/" $FILEPATH
git add $FILEPATH
git commit -m "chore(suite): bump Suite version to $RELEASE_VERSION [RELEASE ONLY]"
git push

echo Creating testing branch "$TEST_UPGRADE_VERSION"...
git switch -c release/test-"$TEST_UPGRADE_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$TEST_UPGRADE_VERSION\2/" $FILEPATH
git add $FILEPATH
git commit -m "chore(suite): set Suite version to $TEST_UPGRADE_VERSION for testing [RELEASE ONLY]"
git push

echo Creating testing branch "$TEST_DOWNGRADE_VERSION"...
git switch -c release/test-"$TEST_DOWNGRADE_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$TEST_DOWNGRADE_VERSION\2/" $FILEPATH
git add $FILEPATH
git commit -m "chore(suite): set Suite version to $TEST_DOWNGRADE_VERSION for testing [RELEASE ONLY]"
git push

echo Bumping beta version to "$BETA_VERSION"...
git switch -c chore/bump-suite-version-"$BETA_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$BETA_VERSION\2/" $FILEPATH
git add $FILEPATH
git commit -m "chore(suite): bump beta version to $BETA_VERSION"
git push

echo Creating pull request...
if ! OUTPUT=$(gh pr create --repo trezor/trezor-suite --base $MAIN_BRANCH --title "Bump beta version to $BETA_VERSION" --body "Automatically generated PR to bump beta Suite version" --label deployment --web 2>&1); then
  tput setaf 3
  echo -e "Pull request not created. Create one manually on GitHub!\n${OUTPUT}"
  tput sgr0
fi

echo Switching to $MAIN_BRANCH...
git switch $MAIN_BRANCH
