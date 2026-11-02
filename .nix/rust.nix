{ pkgs }:

{
  extraPackages = [
    pkgs.rustc
    pkgs.rustfmt
    pkgs.cargo
    pkgs.cargo-cross
  ];
}
