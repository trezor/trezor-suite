{ pkgs }:

let
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    # 34 is the Pixel_6_API_34 emulator image; 36 is RN/Expo compileSdk.
    platformVersions = [ "34" "36" ];
    # 36 is RN's default; 35 is still requested by native modules (e.g. quick-crypto).
    buildToolsVersions = [ "35.0.0" "36.0.0" ];
    includeEmulator = true;
    includeSystemImages = true;
    systemImageTypes = [ "google_apis" ];
    abiVersions = [ "x86_64" ];
    includeNDK = true;
    # All Android modules inherit the React Native NDK version.
    ndkVersions = [ "27.1.12297006" ];
    cmakeVersions = [ "3.22.1" ];
  };
in
rec {
  androidSdk = androidComposition.androidsdk;
  jdk = pkgs.jdk17;
  extraPackages = [ pkgs.nix-ld pkgs.aapt ];

  nixLdHook = ''
    export NIX_LD=$(nix eval --raw nixpkgs#stdenv.cc.bintools.dynamicLinker)
    export NIX_LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc
      pkgs.gcc.cc.lib
      pkgs.glibc
      pkgs.zlib
      pkgs.icu
      pkgs.openssl
      pkgs.libcxx
      pkgs.libxcb
      pkgs.xorg.libX11
    ]}"
  '';
  
  shellHook = ''
    # Java & Android SDK setup for React Native / Expo Android
    export JAVA_HOME="${pkgs.jdk17}"
    export PATH="$JAVA_HOME/bin:$PATH"
    
    # Set up composite Android SDK with required components
    export ANDROID_SDK_ROOT="$HOME/.android/nix-sdk"
    export ANDROID_HOME="$ANDROID_SDK_ROOT"
    mkdir -p "$ANDROID_HOME"
    
    # Link SDK components from Nix store
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/emulator" "$ANDROID_HOME/emulator"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/system-images" "$ANDROID_HOME/system-images"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/platform-tools" "$ANDROID_HOME/platform-tools"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/cmdline-tools" "$ANDROID_HOME/cmdline-tools"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/build-tools" "$ANDROID_HOME/build-tools"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/platforms" "$ANDROID_HOME/platforms"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/ndk" "$ANDROID_HOME/ndk"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/cmake" "$ANDROID_HOME/cmake"
    ln -sfn "${androidComposition.androidsdk}/libexec/android-sdk/licenses" "$ANDROID_HOME/licenses"

    # Entering a shell roots the SDK only for the lifetime of that process, so the
    # weekly nix-collect-garbage deletes this 13.9 GiB closure between sessions and
    # the next entry refetches it from Google. Register a persistent indirect root
    # so the symlinks above keep resolving. Rooting the SDK rather than the whole
    # shell also keeps the emulator and both system images, which are inside its
    # closure, without retaining every development tool.
    #
    # The root is per-user and shared by every checkout, matching the ~/.android
    # arrangement above, so it protects whichever SDK a shell selected last. A
    # checkout on a different Android revision repoints it and the previously
    # pinned closure becomes collectable again.
    #
    #   inspect: nix-store --gc --print-roots | grep trezor-suite-android-shell
    #   remove:  rm ~/.local/state/nix/gcroots/trezor-suite-android-shell
    trezorAndroidSdkRoot="''${XDG_STATE_HOME:-$HOME/.local/state}/nix/gcroots/trezor-suite-android-shell"
    if [ "$(readlink "$trezorAndroidSdkRoot" 2>/dev/null)" != "${androidComposition.androidsdk}" ]; then
      mkdir -p "$(dirname "$trezorAndroidSdkRoot")"
      # Concurrent shell entries would otherwise race on the same link.
      (
        ${pkgs.util-linux}/bin/flock 9
        if [ "$(readlink "$trezorAndroidSdkRoot" 2>/dev/null)" != "${androidComposition.androidsdk}" ]; then
          # nix-store writes the link only once realisation succeeds, so a failure
          # leaves an existing pin in place rather than dropping protection.
          nix-store --realise "${androidComposition.androidsdk}" \
            --add-root "$trezorAndroidSdkRoot" --indirect >/dev/null \
            && echo "✓ Pinned Android SDK against garbage collection"
        fi
      ) 9>"$trezorAndroidSdkRoot.lock"
    fi

    # Add Android tools to PATH
    export PATH="${androidComposition.androidsdk}/bin:$PATH"
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
}
