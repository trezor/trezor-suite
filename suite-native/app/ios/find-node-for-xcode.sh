#!/bin/bash

# This script is mostly copied from node_modules/react-native/scripts/xcode/find-node-for-xcode.sh
# It was necessary to copy it because the original script was deprecated in favor of manually defining
# you node path in .xcode.env file. This is quite unfortunate because node could be located in many different
# places depends if you use nvm, fnm, nodenv, asdf, volta, etc. So I decided to copy the script and use it
# to setup node env as RN did automatically before.

# Part for "fnm" was modified because it doesn't called "fnm use" before and that caused to fallback default node version

# This script needs to be executed in same pwd where .nvmrc is located.

set -e

# WHY WE NEED THIS:
# This script is used to find a valid instance of `node` installed in the machine.
# This script is sourced by other scripts to get access to node.
# Specifically, it is used by the `react-native-xcode.sh` script, invoked by a
# post-build phase in Xcode, to build the js files required by React Native.
#
# DEPRECATION NOTE:
# React Native should not make assumptions on your current node environment.
# This file is deprecated and will be removed in a future release in favor of something
# node-agnostic and configurable by the developers.

# remove global prefix if it's already set
# the running shell process will choose a node binary and a global package directory breaks version managers
unset PREFIX

# Support Homebrew on M1
HOMEBREW_M1_BIN=/opt/homebrew/bin
if [[ -d $HOMEBREW_M1_BIN && ! $PATH =~ $HOMEBREW_M1_BIN ]]; then
  export PATH="$HOMEBREW_M1_BIN:$PATH"
fi

# Define NVM_DIR and source the nvm.sh setup script
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"

# Source nvm with '--no-use' and then `nvm use` to respect .nvmrc
# See: https://github.com/nvm-sh/nvm/issues/2053
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh" --no-use
  nvm use 2> /dev/null || nvm use default
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$(brew --prefix nvm)/nvm.sh" --no-use
  nvm use 2> /dev/null || nvm use default
fi

# Set up the nodenv node version manager if present
if [[ -x "$HOME/.nodenv/bin/nodenv" ]]; then
  eval "$("$HOME/.nodenv/bin/nodenv" init -)"
elif [[ -x "$(command -v brew)" && -x "$(brew --prefix nodenv)/bin/nodenv" ]]; then
  eval "$("$(brew --prefix nodenv)/bin/nodenv" init -)"
fi

# Set up the ndenv of anyenv if preset
if [[ ! -x node && -d ${HOME}/.anyenv/bin ]]; then
  export PATH=${HOME}/.anyenv/bin:${PATH}
  if [[ "$(anyenv envs | grep -c ndenv )" -eq 1 ]]; then
    eval "$(anyenv init -)"
  fi
fi

# Set up asdf-vm if present
if [[ -f "$HOME/.asdf/asdf.sh" ]]; then
  # shellcheck source=/dev/null
  . "$HOME/.asdf/asdf.sh"
elif [[ -x "$(command -v brew)" && -f "$(brew --prefix asdf)/asdf.sh" ]]; then
  # shellcheck source=/dev/null
  . "$(brew --prefix asdf)/asdf.sh"
fi

# Set up volta if present
if [[ -x "$HOME/.volta/bin/node" ]]; then
  export VOLTA_HOME="$HOME/.volta"
  export PATH="$VOLTA_HOME/bin:$PATH"
fi

# Set up the fnm node version manager if present
if [[ -x "$HOME/.fnm/fnm" ]]; then
  eval "$("$HOME/.fnm/fnm" env)"
  fnm use
elif [[ -x "$(command -v brew)" && -x "$(brew --prefix fnm)/bin/fnm" ]]; then
  eval "$("$(brew --prefix fnm)/bin/fnm" env)"
  fnm use
fi
