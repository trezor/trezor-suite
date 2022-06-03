# Suite native app

## Prerequisites

It's good to have some tools installed before you begin:

1. Android Studio - Useful especially because built-in emulator. [Download here](https://developer.android.com/studio)
2. `adb` - Android debug bridge, needed for communication with real device or emulator. [More info here](https://developer.android.com/studio/command-line/adb). Could be also installed using Android studio. After installation you should verify it is working by calling command `adb devices` that should list connected devices or emulators.
3. `watchman` - [Tool for watching file changes in Metro Bundler](https://facebook.github.io/watchman/docs/install.html)

## Running app on Android

1. Connect device or run emulator. For physical device it's recommended to use [adb over wifi](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+) because you will have free USB port to connect Trezor device.
2. Run packager - `yarn start`
3. Run native build - `yarn android`

## Building Android

You can build release version of app using `yarn build:android`. Output apk will be located in here: `android/app/build/outputs/apk/release/app-release.apk`

## Running app on iOS

Transport layer not working for iOS but it's possible to run app. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Install CocoaPods dependencies - `yarn pods`
2. Connect device or emulator
3. Run packager - `yarn start`
4. Run iOS build - `yarn ios`

## Debugging

Because of usage of new Fabric architecture, it's is not possible to use Chrome debugger anymore. We are compiling our own version of Hermes core with added functions.

Best way how to debug app is download [Flipper](https://fbflipper.com).

## Dependencies, version locks

1. `simple-plist` - some internal dependency of RN want to use version `1.3.0`, but in this version is some error that dependabot doesn't like. Error is not valid for us, but adding `1.3.1` to dev dependencies will fix this warning.

## Updating fonts

1. Place updated fonts to `packages/theme/fonts`
2. Run `yarn react-native link`

## Fastlane and CI


