# the last successful build of nixos-unstable as of 2023-10-30
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/63678e9f3d3afecfeafa0acead6239cdb447574c.tar.gz";
    sha256 = "0l9b5w9riwhnf80w233plb4y028y2psr6gm8avdkwg7jvlga2j41";
  })
{ };

let
  # unstable packages
  electron = electron_27; # use the same version as defined in packages/suite-desktop/package.json
  nodejs = nodejs_18;
  # use older gcc. 10.2.0 with glibc 2.32 for node_modules bindings.
  # electron-builder is packing the app with glibc 2.32, bindings should not be compiled with newer version.
  gccPkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/a78ed5cbdd5427c30ca02a47ce6cccc9b7d17de4.tar.gz";
    sha256 = "0l5b1libi46sc3ly7a5vj04098f63aj5jynxpz44sb396nncnivl";
  }) {};
in
  stdenvNoCC.mkDerivation {
    name = "trezor-suite-dev";
    buildInputs = [
      bash
      git-lfs
      gnupg
      mdbook
      xorg.xhost     # for e2e tests running on localhost
      docker         # for e2e tests running on localhost
      docker-compose # for e2e tests running on localhost
      nodejs
      yarn
      jre
      p7zip
      electron
      pkg-config
      pixman cairo giflib libjpeg libpng librsvg pango            # build dependencies for node-canvas
      shellcheck
    ] ++ lib.optionals stdenv.isLinux [
      appimagekit nsis openjpeg osslsigncode p7zip squashfsTools gccPkgs.gcc # binaries used by node_module: electron-builder
      udev  # used by node_module: usb
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
      gcc
    ]);

    # used by patchelf for WabiSabiClientLibrary in dev mode (see webpack nixos-interpreter-plugin)
    NIX_PATCHELF_LIBRARY_PATH = "${openssl.out}/lib:${zlib}/lib:${gcc.cc.lib}/lib";
    NIX_CC="${gcc}";

    shellHook = ''
      export NODE_OPTIONS=--max_old_space_size=4096
      export CURDIR="$(pwd)"
      export PATH="$PATH:$CURDIR/node_modules/.bin"
      export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
      export USE_SYSTEM_7ZA=true
    '' + lib.optionalString stdenv.isDarwin ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/Applications/"
    '' + lib.optionalString stdenv.isLinux ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
      export npm_config_build_from_source=true  # tell yarn to not download binaries, but build from source
      export PLAYWRIGHT_BROWSERS_PATH="$CURDIR/.cache/ms-playwright"
    '';
  }
