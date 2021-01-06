# the last successful build of nixos-20.09 (stable) as of 2020-10-11
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/0b8799ecaaf0dc6b4c11583a3c96ca5b40fcfdfb.tar.gz";
    sha256 = "11m4aig6cv0zi3gbq2xn9by29cfvnsxgzf9qsvz67qr0yq29ryyz";
  })
{ };

stdenv.mkDerivation {
  name = "trezor-link-dev";
  buildInputs = [
    autoPatchelfHook
    git
    nodejs-12_x
    (yarn.override { nodejs = nodejs-12_x; })
  ];
  shellHook = ''
    export HISTFILE=".nix_bash_history"
    export PATH="$PATH:$(pwd)/node_modules/.bin"
    autoPatchelf $(pwd)/node_modules/flow-bin/
  '';
}
