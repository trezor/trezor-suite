#!/usr/bin/env bash

# Prepare release and testing branches before Suite freeze, bump beta version, and create a pull request.
# You need to have the permission to push to pretected branches in order to execute the script correctly.
# For security reasons, the script can only run locally as we do not have a shared GitHub token with the necessary permissions.
# If you want the script to automatically create a pull request to bump beta version, install and set up gh tool:
# brew install gh
# gh auth login

MAIN_BRANCH=t2b1/base-develop
FILEPATH=packages/suite/package.json

echo Calculating versions...
CURRENT_VERSION=$(grep -m1 -o '\"suiteVersion\": *\"[^\"]*\"' packages/suite/package.json | cut -d':' -f2- | tr -d '\" ')
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
git pull trezor-suite-private $MAIN_BRANCH

echo Creating release branch "$RELEASE_MONTH"...
git switch -c release/"$RELEASE_MONTH" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*)/\1$RELEASE_VERSION\2/" $FILEPATH
git commit -am "chore(suite): bump Suite version to $RELEASE_VERSION [RELEASE ONLY]"
git push trezor-suite-private

echo Creating testing branch "$TEST_UPGRADE_VERSION"...
git switch -c release/test-"$TEST_UPGRADE_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$TEST_UPGRADE_VERSION\2/" $FILEPATH
git commit -am "chore(suite): set Suite version to $TEST_UPGRADE_VERSION for testing [RELEASE ONLY]"
git push trezor-suite-private

echo Creating testing branch "$TEST_DOWNGRADE_VERSION"...
git switch -c release/test-"$TEST_DOWNGRADE_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$TEST_DOWNGRADE_VERSION\2/" $FILEPATH
git commit -am "chore(suite): set Suite version to $TEST_DOWNGRADE_VERSION for testing [RELEASE ONLY]"
git push trezor-suite-private

echo Switching to $MAIN_BRANCH...
git switch $MAIN_BRANCH
