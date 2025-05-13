# pinned to nixos-unstable on commit https://github.com/NixOS/nixpkgs/commit/8d92119c540d78599ba208010c722a60958810f4
# we need to use nixos-unstable to be able to use electron_36, once there is a stable release with it we can change.
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/8d92119c540d78599ba208010c722a60958810f4.tar.gz";
    sha256 = "08w0arf23z6mdnipmpspmkwmmvskd9mjq6b5j8070ryqjpzwas05";
   }) { system = builtins.currentSystem; };

let
  # unstable packages
  electron = electron_36;
  nodejs = nodejs_22;
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
      git
      git-lfs
      gnupg
      mdbook
      xorg.xhost     # for e2e tests running on localhost
      docker         # for e2e tests running on localhost
      docker-compose # for e2e tests running on localhost
      nodejs
      (yarn.override {
        nodejs = null; # use input nodejs
      })
      python3
      python3Packages.pip
      jre
      p7zip
      electron
      pkg-config
      pixman cairo giflib libjpeg libpng librsvg pango            # build dependencies for node-canvas
      shellcheck
    ] ++ lib.optionals stdenv.isLinux [
      nsis openjpeg osslsigncode p7zip squashfsTools gccPkgs.gcc # binaries used by node_module: electron-builder
      udev  # used by node_module: usb
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
    ]);

    # used by patchelf for WabiSabiClientLibrary in dev mode (see webpack nixos-interpreter-plugin)
    NIX_PATCHELF_LIBRARY_PATH = "${openssl.out}/lib:${zlib}/lib:${gcc.cc.lib}/lib";
    NIX_CC="${gcc}";

    shellHook = ''
      export NODE_OPTIONS=--max_old_space_size=4096
      export CURDIR="$(pwd)"
      export PATH="$PATH:$CURDIR/node_modules/.bin"
      export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
    '' + lib.optionalString stdenv.isDarwin ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/Applications/"
    '' + lib.optionalString stdenv.isLinux ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
      export npm_config_build_from_source=true  # tell yarn to not download binaries, but build from source
      export PLAYWRIGHT_BROWSERS_PATH="$CURDIR/.cache/ms-playwright"
    '';
  }
