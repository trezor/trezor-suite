#!/bin/bash

set -e

if [ -z "$PR_NUMBER" ]; then
	PR_NUMBER=$(jq -r ".pull_request.number" "$GITHUB_EVENT_PATH")
	if [[ "$PR_NUMBER" == "null" ]]; then
		PR_NUMBER=$(jq -r ".issue.number" "$GITHUB_EVENT_PATH")
	fi
	if [[ "$PR_NUMBER" == "null" ]]; then
		echo "Failed to determine PR Number."
		exit 1
	fi
fi

echo "Collecting information about PR #$PR_NUMBER of $GITHUB_REPOSITORY..."

if [[ -z "$GITHUB_TOKEN" ]]; then
	echo "Set the GITHUB_TOKEN env variable."
	exit 1
fi

URI=https://api.github.com
API_HEADER="Accept: application/vnd.github.v3+json"
AUTH_HEADER="Authorization: token $GITHUB_TOKEN"

pr_resp=$(curl -X GET -s -H "${AUTH_HEADER}" -H "${API_HEADER}" \
	"${URI}/repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER")

BASE_BRANCH=$(echo "$pr_resp" | jq -r .base.ref)
HEAD_REPO=$(echo "$pr_resp" | jq -r .head.repo.full_name)
HEAD_BRANCH=$(echo "$pr_resp" | jq -r .head.ref)

if [[ -z "$BASE_BRANCH" || "$BASE_BRANCH" == "null" ]]; then
	echo "Cannot get base branch information for PR #$PR_NUMBER!"
	exit 1
fi

echo "Base branch for PR #$PR_NUMBER is $BASE_BRANCH"

# Extract the squash message from the env (workflow_dispatch) or comment body
if [[ -z "$SQUASH_MESSAGE" ]]; then
	COMMENT_BODY=$(jq -r ".comment.body" "$GITHUB_EVENT_PATH")
	SQUASH_MESSAGE="${COMMENT_BODY#/squash }"
fi

if [[ -z "$SQUASH_MESSAGE" || "$SQUASH_MESSAGE" == "/squash" ]]; then
	echo "No commit message provided. Usage: /squash <commit message>"
	exit 1
fi

if [[ -z "$USER_LOGIN" ]]; then
	USER_LOGIN=$(jq -r ".comment.user.login" "$GITHUB_EVENT_PATH")
fi

if [[ "$USER_LOGIN" == "null" ]]; then
	USER_LOGIN=$(jq -r ".pull_request.user.login" "$GITHUB_EVENT_PATH")
fi

user_resp=$(curl -X GET -s -H "${AUTH_HEADER}" -H "${API_HEADER}" \
	"${URI}/users/${USER_LOGIN}")

USER_NAME=$(echo "$user_resp" | jq -r ".name")
if [[ "$USER_NAME" == "null" ]]; then
	USER_NAME=$USER_LOGIN
fi
USER_NAME="${USER_NAME} (Squash PR Action)"

USER_EMAIL=$(echo "$user_resp" | jq -r ".email")
if [[ "$USER_EMAIL" == "null" ]]; then
	USER_EMAIL="$USER_LOGIN@users.noreply.github.com"
fi

USER_TOKEN=${USER_LOGIN//-/_}_TOKEN
UNTRIMMED_COMMITTER_TOKEN=${!USER_TOKEN:-$GITHUB_TOKEN}
COMMITTER_TOKEN="$(echo -e "${UNTRIMMED_COMMITTER_TOKEN}" | tr -d '[:space:]')"

# See https://github.com/actions/checkout/issues/766 for motivation.
git config --global --add safe.directory /github/workspace

git remote set-url origin "https://x-access-token:$COMMITTER_TOKEN@github.com/$GITHUB_REPOSITORY.git"
git config --global user.email "$USER_EMAIL"
git config --global user.name "$USER_NAME"

git remote add fork "https://x-access-token:$COMMITTER_TOKEN@github.com/$HEAD_REPO.git"

set -o xtrace

# make sure branches are up-to-date
git fetch origin "$BASE_BRANCH"
git fetch fork "$HEAD_BRANCH"

# do the squash
git checkout -b "fork/$HEAD_BRANCH" "fork/$HEAD_BRANCH"

MERGE_BASE=$(git merge-base "fork/$HEAD_BRANCH" "origin/$BASE_BRANCH")
git reset --soft "$MERGE_BASE"
git commit -m "$SQUASH_MESSAGE"

# push back
git push --force-with-lease fork "fork/$HEAD_BRANCH:$HEAD_BRANCH"
