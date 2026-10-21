{
  description = "Trezor Suite development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    playwright-web-flake.url = "github:pietdevries94/playwright-web-flake/1.62.1";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      playwright-web-flake,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        overlay = final: prev: {
          inherit (playwright-web-flake.packages.${system}) playwright-test playwright-driver;
        };

        pkgs = import nixpkgs {
          inherit system;
          overlays = [ overlay ];
          config.allowUnfree = true;
          config.android_sdk.accept_license = true;
        };

        androidEnv = import ./.nix/android.nix { inherit pkgs; };
        rustEnv = import ./.nix/rust.nix { inherit pkgs; };

        # Keep in sync with the electron version pinned in package.json
        electron = pkgs.electron_42;

        commonBuildInputs = [
          pkgs.bash
          pkgs.jq
          pkgs.git
          pkgs.git-lfs
          pkgs.gnupg
          pkgs.mdbook
          pkgs.docker
          pkgs.docker-compose
          pkgs.nodejs_24
          (pkgs.yarn.override { nodejs = null; })
          pkgs.python3
          pkgs.python3Packages.pip
          electron
          pkgs.pkg-config
          pkgs.pixman # build dependencies for node-canvas
          pkgs.cairo # build dependencies for node-canvas
          pkgs.giflib # build dependencies for node-canvas
          pkgs.libjpeg # build dependencies for node-canvas
          pkgs.libpng # build dependencies for node-canvas
          pkgs.librsvg # build dependencies for node-canvas
          pkgs.pango # build dependencies for node-canvas
          pkgs.shellcheck
          pkgs.playwright-test # From playwright-web-flake
          pkgs.vips
        ]
        ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
          pkgs.nsis
          pkgs.p7zip
          pkgs.openjpeg
          pkgs.osslsigncode
          pkgs.squashfsTools
          pkgs.udev # used by node_module: usb
        ];

        commonShellHook = ''
          export NODE_OPTIONS=--max_old_space_size=8192
          export CURDIR="$(pwd)"
          export PATH="$PATH:$CURDIR/node_modules/.bin"
          export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
          export ELECTRON_DISABLE_SANDBOX=1
          export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
          export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
        ''
        + pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isDarwin ''
          export ELECTRON_OVERRIDE_DIST_PATH="${electron}/Applications/"
        ''
        + pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
          export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
          export npm_config_build_from_source=true
        '';

      in
      {
        devShells =
          let
            androidShell = pkgs.mkShell {
              buildInputs = commonBuildInputs ++ [
                 androidEnv.jdk
                 androidEnv.androidSdk
               ] ++ androidEnv.extraPackages;

              NIX_PATCHELF_LIBRARY_PATH = "${pkgs.openssl.out}/lib:${pkgs.zlib}/lib:${pkgs.gcc.cc.lib}/lib";
              NIX_CC = "${pkgs.gcc}";

              shellHook = commonShellHook
                + androidEnv.nixLdHook
                + androidEnv.shellHook;
            };

            rustShell = pkgs.mkShell {
              buildInputs = commonBuildInputs ++ rustEnv.extraPackages;

              NIX_PATCHELF_LIBRARY_PATH = "${pkgs.openssl.out}/lib:${pkgs.zlib}/lib:${pkgs.gcc.cc.lib}/lib";
              NIX_CC = "${pkgs.gcc}";

              shellHook = commonShellHook;
            };
          in
          {
            default = pkgs.mkShell {
              buildInputs = commonBuildInputs;
              NIX_PATCHELF_LIBRARY_PATH = "${pkgs.openssl.out}/lib:${pkgs.zlib}/lib:${pkgs.gcc.cc.lib}/lib";
              NIX_CC = "${pkgs.gcc}";
              shellHook = commonShellHook;
            };

            android = androidShell;
            use_android = androidShell;
            rust = rustShell;
          };
      }
    );
}
