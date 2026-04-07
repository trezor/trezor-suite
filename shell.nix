# pinned to nixos-unstable on commit https://github.com/NixOS/nixpkgs/commit/5ae3b07d8d6527c42f17c876e404993199144b6a
# we need to use nixos-unstable to be able to use nodejs_24, once there is a stable release with it we can change.
let
  pkgs = import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/5ae3b07d8d6527c42f17c876e404993199144b6a.tar.gz";
    sha256 = "1zb5ca8jqavb19j7g06a41jg6bvpr20b9lihvham6qywhgaqprz9";
   }) {
    system = builtins.currentSystem;
    config.allowUnfree = true;
    config.android_sdk.accept_license = true;
  };
in
with pkgs;

let
  # unstable packages
  electron = electron_39;
  nodejs = nodejs_24;
  # use older gcc. 10.2.0 with glibc 2.32 for node_modules bindings.
  # electron-builder is packing the app with glibc 2.32, bindings should not be compiled with newer version.
  gccPkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/a78ed5cbdd5427c30ca02a47ce6cccc9b7d17de4.tar.gz";
    sha256 = "0l5b1libi46sc3ly7a5vj04098f63aj5jynxpz44sb396nncnivl";
  }) {};

  useAndroid = builtins.getEnv "USE_ANDROID" == "1";
  androidEnv = if useAndroid then import ./.nix/android.nix { inherit pkgs; } else {};
  extraBuildInputs = pkgs.lib.concatLists [
    (if useAndroid then [ androidEnv.jdk androidEnv.androidSdk ] ++ androidEnv.extraPackages else [jre])
  ];
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
      p7zip
      electron
      pkg-config
      pixman cairo giflib libjpeg libpng librsvg pango            # build dependencies for node-canvas
      shellcheck
      vips
    ] ++ extraBuildInputs
      ++ lib.optionals stdenv.isLinux [
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
      export NODE_OPTIONS=--max_old_space_size=8192
      export CURDIR="$(pwd)"
      export PATH="$PATH:$CURDIR/node_modules/.bin"
      export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
     '' + lib.optionalString useAndroid androidEnv.shellHook
        + lib.optionalString stdenv.isDarwin ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/Applications/"
    '' + lib.optionalString stdenv.isLinux ''
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
      export ELECTRON_DISABLE_SANDBOX=1
      export npm_config_build_from_source=true  # tell yarn to not download binaries, but build from source
      export PLAYWRIGHT_BROWSERS_PATH="$CURDIR/.cache/ms-playwright"
    '';
  }
