# @trezor/suite-native

Trezor Suite native application.

## Prerequisites

It's good to have some tools installed before you begin:

1. Android Studio - Useful especially because of the built-in emulator. [Download here](https://developer.android.com/studio)
1. `adb` - Android debug bridge, needed for communication with real device or emulator. [More info here](https://developer.android.com/studio/command-line/adb). Could be also installed using Android studio. After installation, you should verify that it is working by running command `adb devices`, which should list connected devices or emulators.
1. `watchman` - [Tool for watching file changes in Metro Bundler](https://facebook.github.io/watchman/docs/install.html)

## Running app on Android

1. Connect device or run emulator. For a physical device, it's recommended to use [adb over wifi](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+) because you will have free up a USB port to connect Trezor device.
1. Run packager - `yarn start`
1. Run native build - `yarn android`

## Building Android

You can build a release version of app using `yarn build:android`. Output apk will be located in here: `android/app/build/outputs/apk/release/app-release.apk`

## Running app on iOS

Transport layer not working for iOS but it's possible to run app. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Install CocoaPods dependencies - `yarn pods`
1. Connect device or emulator
1. Run packager - `yarn start`
1. Run iOS build - `yarn ios`

## Debugging

Because of usage of new Fabric architecture, it is not possible to use Chrome debugger anymore. We are compiling our own version of Hermes core with added functions.

Best way how to debug app is download [Flipper](https://fbflipper.com).

## Dependencies, version locks

1. `simple-plist` - some internal dependency of RN wants to use version `1.3.0`, but in this version there is some error that dependabot doesn't like. Error is not valid for us, but adding `1.3.1` to dev dependencies will fix this warning.

## Updating fonts

1. Place updated fonts to `packages/theme/fonts`
1. Run `yarn react-native link`

## Distribution

Fastlane is the easiest way to automate beta deployments and releases for iOS and Android apps.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

### Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

### Available Actions

#### iOS

##### ios beta

```sh
[bundle exec] fastlane ios beta
```

Push a new beta build to TestFlight

---

#### Android

##### android test

```sh
[bundle exec] fastlane android test
```

Runs all the tests

##### android releaseInternal

```sh
[bundle exec] fastlane android releaseInternal
```

Build and upload the app (release build) to play Store for an internal testing release.

##### android develop

```sh
[bundle exec] fastlane android develop
```

Build and upload the app to Firebase App Distribution for testing (develop) release.
