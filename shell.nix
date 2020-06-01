with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "trezor-suite-dev";
  buildInputs = [
    nodejs
    yarn
  ];
  shellHook = ''
    export PATH="$PATH:$(pwd)/node_modules/.bin"
  '';
}
