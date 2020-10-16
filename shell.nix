# the last successful build of nixos-20.09 (stable) as of 2020-10-11
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/0b8799ecaaf0dc6b4c11583a3c96ca5b40fcfdfb.tar.gz";
    sha256 = "11m4aig6cv0zi3gbq2xn9by29cfvnsxgzf9qsvz67qr0yq29ryyz";
  })
{ };

stdenv.mkDerivation {
  name = "trezor-suite-dev";
  buildInputs = [
    nodejs
    mdbook
    yarn
  ] ++ lib.optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
    Cocoa
    CoreServices
  ]);
  shellHook = ''
    export PATH="$PATH:$(pwd)/node_modules/.bin"
  '';
}
