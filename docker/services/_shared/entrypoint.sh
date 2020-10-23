#!/usr/bin/env bash

set -e -o pipefail

# this is just a sanity check
if [[ "$UID" != "$BUILDTIME_UID" ]]; then
  echo "Detected mismatch between user IDs. The UID used to build the docker image is different from UID running it."
  echo "This could lead to unexpected file permissions inside docker. Please clean and rebuild everything from scratch."
  echo "UID=$UID, BUILDTIME_UID=$BUILDTIME_UID"
  exit 1
fi

# this is just a sanity check
if [[ "$GID" != "$BUILDTIME_GID" ]]; then
  echo "Detected mismatch between group IDs. The GID used to build the docker image is different from GID running it."
  echo "This could lead to unexpected file permissions inside docker. Please clean and rebuild everything from scratch."
  echo "GID=$GID, BUILDTIME_GID=$BUILDTIME_GID"
  exit 2
fi

# fix permissions on mounted mutagen-managed volume
# this is a workaround for https://github.com/mutagen-io/mutagen/issues/224
if [[ -d ~/trezor-suite ]]; then
  sudo chown user:user ~/trezor-suite
fi

# fix permissions on cache volume
# this is a workaround for https://github.com/docker/compose/issues/3270
if [[ -d ~/.cache ]]; then
  sudo chown user:user ~/.cache
fi

# some trezor webpack machinery requires trezor-suite to be a git repo (it shells out to do `git rev-parse`)
# we don't want to sync whole .git into the container (that would be slow)
# this is a workaround for https://github.com/pirelenito/git-revision-webpack-plugin/issues/4
if [[ -d ~/trezor-suite ]] && ! git -C ~/trezor-suite rev-parse; then
  echo "Doing first-time initialization of the trezor-suite folder as a git repo"
  echo "This is to work around https://github.com/pirelenito/git-revision-webpack-plugin/issues/4"

  cd ~/trezor-suite
  git init
  git config user.email "user@container"
  git config user.name "Container User"
  git commit -m "a bogus commit to work around git-revision-webpack-plugin/issues/4" --allow-empty
fi

exec "$@"
