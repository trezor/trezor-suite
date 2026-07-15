# pinned to nixos-unstable on commit https://github.com/NixOS/nixpkgs/commit/f614e907b485bf0ea684552d626f2cc569313fe2
with import
  (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/f614e907b485bf0ea684552d626f2cc569313fe2.tar.gz";
    sha256 = "17m87ra13d3kwlrw8p4vv7w5yyq5pc2qlpl983r47cflw9mzgdz7";
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
