#!/usr/bin/env bash
set -e 

# TODO: change to develop after merger
BASELINE_BRANCH=test/native/reassure-baseline-branch
# BASELINE_BRANCH=${GITHUB_BASE_REF:="test/native/reassure-baseline-branch"}

# Required for `git switch` on CI
git fetch origin

# Gather baseline perf measurements
git switch "$BASELINE_BRANCH"

yarn install
yarn test:perf --baseline

# Gather current perf measurements & compare results
git switch --detach -

yarn install
yarn test:perf --branch