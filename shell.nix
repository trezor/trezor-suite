with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "trezor-suite-dev";
  buildInputs = [
    nodejs-12_x
    mdbook
    (yarn.override { nodejs = nodejs-12_x; })
  ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
    Cocoa
    CoreServices
  ]);
  shellHook = ''
    export PATH="$PATH:$(pwd)/node_modules/.bin"
  '';
}
