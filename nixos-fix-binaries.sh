#!/usr/bin/env bash

if [ -f /etc/NIXOS ] ; then
  if [ -z "$IN_NIX_SHELL" ] ; then
    echo "You need to run this script in a nix-shell. Aborting"
    exit 1
  fi
  # replace bundled binaries in node_modules with symlinks
  ln -sf "$(which 7za)" "$CURDIR"/node_modules/7zip-bin/linux/x64/7za || :
  # replace bundled binaries in .cache/electron-builder with symlinks
  ln -sf "$(which desktop-file-validate)" "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/desktop-file-validate || :
  ln -sf "$(which opj_decompress)" "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/opj_decompress || :
  ln -sf "$(which mksquashfs)" "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/mksquashfs || :
  ln -sf "$(which makensis)" "$ELECTRON_BUILDER_CACHE"/nsis/nsis-3.0.4.1/linux/makensis || :
  ln -sf "$(which osslsigncode)" "$ELECTRON_BUILDER_CACHE"/winCodeSign/winCodeSign-2.6.0/linux/osslsigncode || :
else
  echo "This is not NixOS. Aborting"
  exit 1
fi
