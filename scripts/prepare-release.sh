#!/usr/bin/env bash

# Run this script to freeze development of the next SUite version.
# Prepare release branch, push it to the release repository, bump beta version, and create a pull request.
# You need to have the permission to push to pretected branches in order to execute the script correctly.
# You need to have the permission to push to the release repository, otherwise that step is not performed.
# For security reasons, the script can only run locally as we do not have a shared GitHub token with the necessary permissions.
# If you want the script to automatically create a pull request to bump beta version, install and set up gh tool:
# brew install gh
# gh auth login

MAIN_BRANCH=develop
FILEPATH=packages/suite/package.json
ORIGIN='origin'

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
git push --set-upstream $ORIGIN "$(git branch --show-current)"

echo Pushing to the release repository...
if ! OUTPUT=$(git push -f https://github.com/trezor/trezor-suite-release.git HEAD 2>&1); then
  tput setaf 3
  echo -e "Could not push to the release repository.\n${OUTPUT}"
  tput sgr0
fi

echo Bumping beta version to "$BETA_VERSION"...
git switch -c chore/bump-suite-version-"$BETA_VERSION" $MAIN_BRANCH
sed -i '' -E "s/(\"suiteVersion\": \")[^\"]*(\".*$)/\1$BETA_VERSION\2/" $FILEPATH
git add $FILEPATH
git commit -m "chore(suite): bump beta version to $BETA_VERSION"
git push --set-upstream $ORIGIN "$(git branch --show-current)"

echo Creating pull request...
if ! OUTPUT=$(gh pr create --repo trezor/trezor-suite --base $MAIN_BRANCH --title "Bump beta version to $BETA_VERSION" --body "Automatically generated PR to bump beta Suite version" --label deployment --web 2>&1); then
  tput setaf 3
  echo -e "Pull request not created. Create one manually on GitHub!\n${OUTPUT}"
  tput sgr0
fi

echo Switching to $MAIN_BRANCH...
git switch $MAIN_BRANCH
