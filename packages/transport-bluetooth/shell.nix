# pinned to nixos-24.05 on commit https://github.com/NixOS/nixpkgs/commit/c6ce5bd4ab657df958ebd6f38723f81c5546a661
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/c6ce5bd4ab657df958ebd6f38723f81c5546a661.tar.gz";
    sha256 = "0i5z7b087kr2hnkgs17d36c54arjbgwlwyxw1ibh03d1k1xfcyf2";
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
