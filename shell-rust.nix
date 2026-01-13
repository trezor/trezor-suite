{ pkgs }:

{
  buildInputs = [
    pkgs.openssl
    pkgs.dbus
    pkgs.rustc
    pkgs.rustfmt
    pkgs.cargo
    pkgs.cargo-cross
    pkgs.pkg-config
  ];
}
