{ pkgs }:

let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    # Keep API 34 available alongside the API 36 CI emulator.
    platformVersions = [
      "34"
      "36"
    ];
    # 36 is RN's default; 35 is still requested by native modules (e.g. quick-crypto).
    buildToolsVersions = [
      "35.0.0"
      "36.0.0"
    ];
    includeEmulator = true;
    includeSystemImages = true;
    systemImageTypes = [ "google_apis" ];
    abiVersions = [ "x86_64" ];
    includeNDK = true;
    # Keep both versions required by React Native and native modules.
    ndkVersions = [
      "27.1.12297006"
      "27.0.12077973"
    ];
    cmakeVersions = [ "3.22.1" ];
  };

  androidSdk = androidComposition.androidsdk;
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

    # Keep both emulator versions available for local testing.
    for api in 34 36; do
      avd_name="Pixel_6_API_$api"
      if [ ! -d "$HOME/.android/avd/$avd_name.avd" ]; then
        avdmanager create avd -n "$avd_name" -d pixel_6 --package "system-images;android-$api;google_apis;x86_64"

        # Enable GPU acceleration, which avdmanager cannot configure.
        sed -i \
          -e 's/^hw\.gpu\.enabled=no$/hw.gpu.enabled=yes/' \
          -e 's/^hw\.gpu\.mode=auto$/hw.gpu.mode=host/' \
          "$HOME/.android/avd/$avd_name.avd/config.ini"

        echo "✓ Created Android emulator device: $avd_name"
      fi
    done

    echo "- Java $(java -version 2>&1 | head -n1)"
    command -v adb >/dev/null 2>&1 && echo "- adb $(adb version | head -n1)" || echo "- adb not found (install SDK packages)"
    command -v emulator >/dev/null 2>&1 && echo "- emulator $(emulator -version | head -n1)" || echo "- emulator not found"
  '';
in
{
  inherit
    androidSdk
    jdk
    extraPackages
    nixLdHook
    ;
  shellHook = androidShellHook;
}
