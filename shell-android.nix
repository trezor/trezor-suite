{ pkgs }:

let
  # androidSdk = pkgs.androidenv.androidPkgs_9_0.androidsdk;
  # https://github.com/NixOS/nixpkgs/blob/master/doc/languages-frameworks/android.section.md
  androidComposition = pkgs.androidenv.composeAndroidPackages {
    cmdLineToolsVersion = "8.0";
    toolsVersion = "26.1.1";
    platformToolsVersion = "33.0.3";
    buildToolsVersions = [ "30.0.3" "33.0.0" ];
    includeEmulator = false;
    emulatorVersion = "33.1.6";
    platformVersions = [ "33" ];
    includeSources = false;
    includeSystemImages = false;
    systemImageTypes = [ "google_apis_playstore" ];
    abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
    cmakeVersions = [ "3.18.1" ];
    includeNDK = true;
    ndkVersions = ["23.1.7779620"];
    useGoogleAPIs = false;
    useGoogleTVAddOns = false;
    includeExtras = [
      "extras;google;gcm"
    ];
};

in {
  config.android_sdk.accept_license = true;

  buildInputs = [
    pkgs.jdk11
    #  androidenv.androidPkgs_9_0.platform-tools
    androidComposition.androidsdk
  ];
}
