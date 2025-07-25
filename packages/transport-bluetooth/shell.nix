# pinned to nixos-unstable on commit https://github.com/NixOS/nixpkgs/commit/8d92119c540d78599ba208010c722a60958810f4
# we need to use nixos-unstable to be able to use electron_36, once there is a stable release with it we can change.
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/8d92119c540d78599ba208010c722a60958810f4.tar.gz";
    sha256 = "08w0arf23z6mdnipmpspmkwmmvskd9mjq6b5j8070ryqjpzwas05";
  })
{ };

stdenv.mkDerivation {
  name = "trezor-bluetooth-dev";
  nativeBuildInputs = [
    rustc
    rustfmt
    cargo
    cargo-cross
    pkg-config
  ];

  buildInputs = [
    openssl
    dbus
  ];

  RUST_BACKTRACE = 1;
  RUST_LOG = "debug";
}
