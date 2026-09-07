{
  description = "Trezor Suite development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    playwright-web-flake.url = "github:pietdevries94/playwright-web-flake/1.62.1";
    old-gcc-nixpkgs.url = "github:NixOS/nixpkgs/a78ed5cbdd5427c30ca02a47ce6cccc9b7d17de4"; # For GCC 10.2.0
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      playwright-web-flake,
      old-gcc-nixpkgs,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          config.android_sdk.accept_license = true;
        };
        shared = import ./.nix/shared.nix { inherit pkgs; };
        desktop = import ./.nix/desktop.nix {
          inherit
            pkgs
            shared
            playwright-web-flake
            old-gcc-nixpkgs
            ;
        };
        android = import ./.nix/android.nix { inherit pkgs shared; };
      in
      {
        devShells = {
          inherit desktop android;
          default = desktop;
          use_android = android;
        };
      }
    );
}
