# the last successful build of nixos-unstable as of 2023-10-30
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/63678e9f3d3afecfeafa0acead6239cdb447574c.tar.gz";
    sha256 = "0l9b5w9riwhnf80w233plb4y028y2psr6gm8avdkwg7jvlga2j41";
  })
{ };

stdenv.mkDerivation {
  name = "trezor-ble-dev";
  nativeBuildInputs = [
    rustc
    rustfmt
    # rustup
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
