with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
        nodejs-12_x
        (yarn.override { nodejs = nodejs-12_x; })
    ];
}
