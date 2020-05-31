with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "trezor-suite-dev";
  buildInputs = [
    nodejs
    yarn
  ];
}
