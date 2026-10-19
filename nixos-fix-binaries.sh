#!/usr/bin/env bash
# shellcheck disable=SC2230 # TODO: 'which' is not posix, should be replaced by 'command -v' builtin instead

if [ -f /etc/NIXOS ] ; then
  if [ -z "$IN_NIX_SHELL" ] ; then
    echo "You need to run this script in a nix-shell. Aborting"
    exit 1
  fi

  # replace bundled binaries in .cache/electron-builder with symlinks

  ln -sf "$(which mksquashfs)" "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/mksquashfs || :
  ln -sf "$(which makensis)" "$ELECTRON_BUILDER_CACHE"/nsis/nsis-3.0.4.1/linux/makensis || :
  ln -sf "$(which osslsigncode)" "$ELECTRON_BUILDER_CACHE"/winCodeSign/winCodeSign-2.6.0/linux/osslsigncode || :

  # link system browser for playwright e2e tests

  ln -sf "$(which chromium)" "$PLAYWRIGHT_BROWSERS_PATH"/chromium-*/chrome-linux/chrome || :

else
  echo "This is not NixOS. Aborting"
  exit 1
fi
