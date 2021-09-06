# the last successful build of nixos-21.05 (stable) as of 2021-08-02
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/16bf3980bfa0d8929639be93fa8491ebad9d61ec.tar.gz";
    sha256 = "0azsnd2pjg53siv97n5l62j0c8b5whi5bd5a2wqz1sphkirf3cgq";
  })
{ };

let
  SuitePython = python3.withPackages(ps: [
    ps.yamllint
  ]);
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
      SuitePython
      jre
    ] ++ lib.optionals stdenv.isLinux [
      pkg-config
      python2                                                     # older node-gyp still requires python2.x
      p7zip                                                       # binaries used by node_module: 7zip-bin
      appimagekit nsis openjpeg osslsigncode p7zip squashfsTools  # binaries used by node_module: electron-builder
      cairo giflib libjpeg libpng librsvg pango           # build dependencies for node-canvas
      # winePackages.minimal
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
      p7zip
      electron
    ]);
    shellHook = ''
      export NODE_OPTIONS=--max_old_space_size=4096
      export CURDIR="$(pwd)"
      export PATH="$PATH:$CURDIR/node_modules/.bin"
      export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
    '' + lib.optionalString stdenv.isLinux ''
      export npm_config_build_from_source=true  # tell yarn to not download binaries, but build from source
      export USE_SYSTEM_7ZA=true
      export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
    '';
  }
