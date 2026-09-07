{
  pkgs,
  shared,
  playwright-web-flake,
  old-gcc-nixpkgs,
}:

let
  system = pkgs.stdenv.hostPlatform.system;
  playwright = playwright-web-flake.packages.${system};
  gccPkgs = import old-gcc-nixpkgs { inherit system; };

  # Keep in sync with the Electron version pinned in package.json.
  electron = pkgs.electron_42;

  desktopBuildInputs = [
    electron
    playwright.playwright-test # From playwright-web-flake.
  ]
  ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
    pkgs.nsis
    pkgs.p7zip
    pkgs.openjpeg
    pkgs.osslsigncode
    pkgs.squashfsTools
    gccPkgs.gcc # Older GCC
  ];

  desktopShellHook = ''
    export ELECTRON_BUILDER_CACHE="$CURDIR/.cache/electron-builder"
    export ELECTRON_DISABLE_SANDBOX=1
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
    export PLAYWRIGHT_BROWSERS_PATH="${playwright.playwright-driver.browsers}"
  ''
  + pkgs.lib.optionalString pkgs.stdenv.isDarwin ''
    export ELECTRON_OVERRIDE_DIST_PATH="${electron}/Applications/"
  ''
  + pkgs.lib.optionalString pkgs.stdenv.isLinux ''
    export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
  '';

in
pkgs.mkShell (
  shared
  // {
    buildInputs = shared.buildInputs ++ desktopBuildInputs;
    # Store paths in hooks also pull in dependencies, so keep browser paths here.
    shellHook =
      shared.shellHook
      + desktopShellHook
      + ''
        echo "- Playwright $(playwright --version)"
      '';
  }
)
