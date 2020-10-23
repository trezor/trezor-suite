#!/usr/bin/env bash

# this is a config file shared between scripts in this folder
#
# to override default configuration setup your environment TREZOR_SUITE_* variables, consider using direnv

use_or_generate_random_password() {
  local password_file
  password_file=./.generated-password
  if [[ -e "$password_file" ]]; then
    cat "$password_file"
  else
    openssl rand -base64 32 | tee "$password_file"
  fi
}

# note in default case we assume this file is sourced when cwd is already set to ./docker
TREZOR_SUITE_DOCKER_HOME=${TREZOR_SUITE_DOCKER_HOME:-$(pwd)}
TREZOR_SUITE_HOME=${TREZOR_SUITE_HOME:-$(cd .. && pwd)}

# this is ugly and hopefully just a temporary measure
# it is needed to forward ports between containers using ssh
TREZOR_SUITE_ROOT_PASSWORD=${TREZOR_SUITE_ROOT_PASSWORD:-$(use_or_generate_random_password)}

# these are UID/GID of our user inside container
TREZOR_SUITE_DOCKER_UID=${TREZOR_SUITE_DOCKER_UID:-9001}
TREZOR_SUITE_DOCKER_GID=${TREZOR_SUITE_DOCKER_GID:-9001}

# list of supported shells to install inside docker containers via apt-get
TREZOR_SUITE_SUPPORTED_SHELLS=${TREZOR_SUITE_SUPPORTED_SHELLS:-bash fish}

# this shell will be used by default when using our shell wrappers
TREZOR_SUITE_PREFERRED_SHELL=${TREZOR_SUITE_PREFERRED_SHELL:-bash}

TREZOR_SUITE_NO_AUTO_BUILD=${TREZOR_SUITE_NO_AUTO_BUILD}

export_trezor_suite_env() {
  # export variables with our prefix
  for name in "${!TREZOR_SUITE_@}"; do
    export "${name?}"
  done
}
