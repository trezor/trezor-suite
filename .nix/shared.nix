{ pkgs }:

let
  commonShellHook = ''
    export NODE_OPTIONS=--max_old_space_size=8192
    export CURDIR="$(pwd)"
    export PATH="$PATH:$CURDIR/node_modules/.bin"
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
  ''
  + pkgs.lib.optionalString pkgs.stdenv.isLinux ''
    export npm_config_build_from_source=true
  '';

  welcomeMessage = ''
    echo "welcome to the Trezor Suite development environment"
    echo "- Node.js $(node --version)"
    echo "- npm $(npm --version)"
    echo "- Yarn $(yarn --version)"
  '';
in
{
  buildInputs = [
    pkgs.bash
    pkgs.jq
    pkgs.git
    pkgs.git-lfs
    pkgs.gnupg
    pkgs.mdbook
    pkgs.docker
    pkgs.docker-compose
    pkgs.nodejs_24
    (pkgs.yarn.override { nodejs = null; })
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.pkg-config
    pkgs.pixman # build dependencies for node-canvas
    pkgs.cairo # build dependencies for node-canvas
    pkgs.giflib # build dependencies for node-canvas
    pkgs.libjpeg # build dependencies for node-canvas
    pkgs.libpng # build dependencies for node-canvas
    pkgs.librsvg # build dependencies for node-canvas
    pkgs.pango # build dependencies for node-canvas
    pkgs.shellcheck
    pkgs.vips
  ]
  ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
    pkgs.udev # used by node_module: usb
  ];

  NIX_PATCHELF_LIBRARY_PATH = "${pkgs.openssl.out}/lib:${pkgs.zlib}/lib:${pkgs.gcc.cc.lib}/lib";
  NIX_CC = "${pkgs.gcc}";
  shellHook = commonShellHook + welcomeMessage;
}
