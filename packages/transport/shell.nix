# the last successful build of nixos-21.05 (stable) as of 2021-08-02
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/16bf3980bfa0d8929639be93fa8491ebad9d61ec.tar.gz";
    sha256 = "0azsnd2pjg53siv97n5l62j0c8b5whi5bd5a2wqz1sphkirf3cgq";
  })
{ };

stdenv.mkDerivation {
  name = "trezor-link-dev";
  buildInputs = [
    autoPatchelfHook
    git
    nodejs
    yarn
  ];
  shellHook = ''
    export HISTFILE=".nix_bash_history"
    export PATH="$PATH:$(pwd)/node_modules/.bin"
  '';
}
