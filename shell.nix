# the last successful build of nixpkgs-unstable as of 2023-02-28
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/7785526659fe5885abbd88a85a23a11bd0617e3c.tar.gz";
    sha256 = "0sjsy3jihhdmck6hn9lizwvk25kzf5ags1p21xqqn3kj7fv5ax9x";
  })
{ };

let
  # unstable packages
  electron = electron_23;  # use the same version as defined in packages/suite-desktop/package.json
  nodejs = nodejs-18_x;
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
      # winePackages.minimal
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
    ]);

    # for WalletWasabi.WabiSabiClientLibrary
    LD_LIBRARY_PATH = "${gcc}/lib:${openssl.out}/lib:${zlib}/lib:${stdenv.cc.cc.lib}/lib";

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
