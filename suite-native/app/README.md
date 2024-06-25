# @suite-native/app

Trezor Suite native application.

## Prerequisites

Generally it's recommended to follow official [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) guide.

1. [Android Guide](https://reactnative.dev/docs/set-up-your-environment?os=macos&platform=android)
2. [iOS Guide](https://reactnative.dev/docs/set-up-your-environment?os=macos&platform=ios)

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

## Before you run the app

1. Run `yarn prebuild:clean` to generate `ios/` and `android/` directories. (It's necessary to re-run faster version of this command `yarn prebuild` everytime when you change branch/pull/rebase).

## Running app on Android

1. Connect device or run emulator. For a physical device, it's recommended to use [adb over wifi](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+) because you will have free up a USB port to connect Trezor device.
1. Run packager - `yarn start`
1. Run native build - `yarn android`
1. Reverse android emulator ports to enable communication between the app and localhost services - `yarn reverse-ports`

## Running app on iOS

Transport layer not working for iOS but it's possible to run app in watch-only mode. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Run packager - `yarn start`
1. Run `yarn ios` to build and run the app on iOS simulator/device

Or via Xcode (for native errors debug):

1. Open `ios/TrezorSuite.xcworkspace` in Xcode
1. Hit ▶️ `Run` button

## Troubleshooting

1. For any issues with the build, try to clean the project and rebuild it:
    - `yarn prebuild:clean`
    - `yarn android` or `yarn ios`
1. In case of issues with the packager, try to restart it with `yarn start --reset-cache`.
1. Sometimes it's helpful to combine two previous points with uninstalling the app from the device/emulator.
1. Make sure you are using pure Node or `nvm` for managing node version (other version managers like `fnm` can cause build issues on iOS).
