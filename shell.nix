# the last successful build of nixos-20.09 (stable) as of 2020-10-11
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/0b8799ecaaf0dc6b4c11583a3c96ca5b40fcfdfb.tar.gz";
    sha256 = "11m4aig6cv0zi3gbq2xn9by29cfvnsxgzf9qsvz67qr0yq29ryyz";
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
      mdbook
      nodejs
      # winePackages.minimal
      yarn
      SuitePython
    ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
      Cocoa
      CoreServices
    ]);
    shellHook = ''
      export CURDIR="$(pwd)"
      export PATH="$PATH:$CURDIR/node_modules/.bin"
      export ELECTRON_BUILDER_CACHE="$CURDIR"/.cache/electron-builder
      if [ "$(uname)" = "Linux" ] ; then
        # replace bundled binaries in node_modules with symlinks
        ln -sf ${p7zip}/bin/7za "$CURDIR"/node_modules/7zip-bin/linux/x64/7za || :
        # replace bundled binaries in .cache/electron-builder with symlinks
        ln -sf ${appimagekit}/bin/desktop-file-validate "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/desktop-file-validate || :
        ln -sf ${openjpeg}/bin/opj_decompress "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/opj_decompress || :
        ln -sf ${squashfsTools}/bin/mksquashfs "$ELECTRON_BUILDER_CACHE"/appimage/appimage-12.0.1/linux-x64/mksquashfs || :
        ln -sf ${nsis}/bin/makensis "$ELECTRON_BUILDER_CACHE"/nsis/nsis-3.0.4.1/linux/makensis || :
        ln -sf ${osslsigncode}/bin/osslsigncode "$ELECTRON_BUILDER_CACHE"/winCodeSign/winCodeSign-2.6.0/linux/osslsigncode || :
      fi
    '';
  }
