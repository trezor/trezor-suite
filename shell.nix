# the last successful build of nixos-stable as of 2023-11-06
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/41de143fda10e33be0f47eab2bfe08a50f234267.tar.gz";
    sha256 = "1xd9k5nv7i42wabrbv51hbbl81llmgijzqlargag2c40hsx1s276";
  })
{ };

let
  # unstable packages
  electron = electron_26;  # use the same version as defined in packages/suite-desktop/package.json
  nodejs = nodejs_18;
in
  stdenv.mkDerivation {
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
      appimagekit nsis openjpeg osslsigncode p7zip squashfsTools  # binaries used by node_module: electron-builder
      udev  # used by node_module: usb
      # winePackages.minimal
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
    ]);

    # for WalletWasabi.WabiSabiClientLibrary
    LD_LIBRARY_PATH = "${gcc}/lib:${zlib}/lib:${stdenv.cc.cc.lib}/lib";

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
