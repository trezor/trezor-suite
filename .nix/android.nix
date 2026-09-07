{ pkgs, shared }:

let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    # 34 is the Pixel_6_API_34 emulator image; 36 is RN/Expo compileSdk.
    platformVersions = [
      "34"
      "36"
    ];
    # 36 is RN's default; 35 is still requested by native modules (e.g. quick-crypto).
    buildToolsVersions = [
      "35.0.0"
      "36.0.0"
    ];
    includeEmulator = false;
    includeSystemImages = false;
    includeNDK = true;
    # Match React Native's default; withAndroidNdkVersion fixes modules that omit it.
    ndkVersions = [ "27.1.12297006" ];
    cmakeVersions = [ "3.22.1" ];
  };

  # Image versions follow platformVersions, so compose the emulator separately.
  emulatorComposition = pkgs.androidenv.composeAndroidPackages {
    platformVersions = [ "34" ];
    buildToolsVersions = [ ];
    includeEmulator = true;
    includeSystemImages = true;
    systemImageTypes = [ "google_apis" ];
    abiVersions = [ "x86_64" ];
    includeNDK = false;
    includeCmake = false;
  };

  # Keep one SDK root so avdmanager can discover the image alongside build tools.
  androidSdk = androidComposition.androidsdk.overrideAttrs (old: {
    postInstall = (old.postInstall or "") + ''
      ln -s ${emulatorComposition.emulator}/libexec/android-sdk/emulator "$out/libexec/android-sdk/emulator"
      ln -s ${emulatorComposition.emulator}/libexec/android-sdk/system-images "$out/libexec/android-sdk/system-images"
      ln -s ${emulatorComposition.emulator}/bin/* "$out/bin/"
    '';
  });
  jdk = pkgs.jdk17;
  extraPackages = [
    pkgs.nix-ld
    pkgs.aapt
  ];

  nixLdHook = ''
    export NIX_LD="${pkgs.stdenv.cc.bintools.dynamicLinker}"
    export NIX_LD_LIBRARY_PATH="${
      pkgs.lib.makeLibraryPath [
        pkgs.stdenv.cc.cc
        pkgs.gcc.cc.lib
        pkgs.glibc
        pkgs.zlib
        pkgs.icu
        pkgs.openssl
        pkgs.libcxx
        pkgs.libxcb
        pkgs.xorg.libX11
      ]
    }"
  '';

  androidShellHook = ''
    # Java & Android SDK setup for React Native / Expo Android
    export JAVA_HOME="${pkgs.jdk17}"
    export PATH="$JAVA_HOME/bin:$PATH"

    # Set up composite Android SDK with required components
    export ANDROID_SDK_ROOT="$HOME/.android/nix-sdk"
    export ANDROID_HOME="$ANDROID_SDK_ROOT"
    mkdir -p "$ANDROID_HOME"

    # Link SDK components from Nix store
    ln -sfn "${androidSdk}/libexec/android-sdk/emulator" "$ANDROID_HOME/emulator"
    ln -sfn "${androidSdk}/libexec/android-sdk/system-images" "$ANDROID_HOME/system-images"
    ln -sfn "${androidSdk}/libexec/android-sdk/platform-tools" "$ANDROID_HOME/platform-tools"
    ln -sfn "${androidSdk}/libexec/android-sdk/cmdline-tools" "$ANDROID_HOME/cmdline-tools"
    ln -sfn "${androidSdk}/libexec/android-sdk/build-tools" "$ANDROID_HOME/build-tools"
    ln -sfn "${androidSdk}/libexec/android-sdk/platforms" "$ANDROID_HOME/platforms"
    ln -sfn "${androidSdk}/libexec/android-sdk/ndk" "$ANDROID_HOME/ndk"
    ln -sfn "${androidSdk}/libexec/android-sdk/cmake" "$ANDROID_HOME/cmake"
    ln -sfn "${androidSdk}/libexec/android-sdk/licenses" "$ANDROID_HOME/licenses"

    # Add Android tools to PATH
    export PATH="${androidSdk}/bin:$PATH"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"

    # Using the nixpkgs aapt2 to resolve an issue with dynamically linked executables
    export GRADLE_OPTS="-Dorg.gradle.project.android.aapt2FromMavenOverride=${pkgs.aapt}/bin/aapt2"

    # Setup Android emulator device if it doesn't exist
    if [ ! -d "$HOME/.android/avd/Pixel_6_API_34.avd" ]; then
      avdmanager create avd -n Pixel_6_API_34 -d pixel_6 --package "system-images;android-34;google_apis;x86_64"

      # enable GPU acceleration, this option is not available in avdmanager
      sed -i \
        -e 's/^hw\.gpu\.enabled=no$/hw.gpu.enabled=yes/' \
        -e 's/^hw\.gpu\.mode=auto$/hw.gpu.mode=host/' \
        $HOME/.android/avd/Pixel_6_API_34.avd/config.ini

      echo "✓ Created Android emulator device: Pixel_6_API_34"
    fi

    echo "- Java $(java -version 2>&1 | head -n1)"
    command -v adb >/dev/null 2>&1 && echo "- adb $(adb version | head -n1)" || echo "- adb not found (install SDK packages)"
    command -v emulator >/dev/null 2>&1 && echo "- emulator $(emulator -version | head -n1)" || echo "- emulator not found"
  '';
in
pkgs.mkShell (
  shared
  // {
    buildInputs =
      shared.buildInputs
      ++ [
        jdk
        androidSdk
      ]
      ++ extraPackages;
    shellHook =
      shared.shellHook
      + ''
        # Workspace installation includes Electron, but Android does not need its binary.
        export ELECTRON_SKIP_BINARY_DOWNLOAD=1
      ''
      + nixLdHook
      + androidShellHook;
  }
)
