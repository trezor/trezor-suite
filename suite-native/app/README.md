# @trezor/suite-native

Trezor Suite native application.

## Prerequisites

It's good to have some tools installed before you begin:

1. Android Studio - Useful especially because of the built-in emulator. [Download here](https://developer.android.com/studio)
1. `adb` - Android debug bridge, needed for communication with real device or emulator. [More info here](https://developer.android.com/studio/command-line/adb). Could be also installed using Android studio. After installation, you should verify that it is working by running command `adb devices`, which should list connected devices or emulators.
1. `watchman` - [Tool for watching file changes in Metro Bundler](https://facebook.github.io/watchman/docs/install.html)
1. `pods` - [CocoaPods](https://cocoapods.org/) is a dependency manager for Cocoa projects.

## Running app on Android

1. Connect device or run emulator. For a physical device, it's recommended to use [adb over wifi](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+) because you will have free up a USB port to connect Trezor device.
1. Run native build - `yarn android`
1. Run packager - `yarn start`

### Optional:

If you're using [Trezor User Env](https://github.com/trezor/trezor-user-env) while running the app, you might need to map the ports for data transport between Trezor emulator and Android device emulator by running `adb reverse tcp:21325 tcp:21325`. If you're running the app from device over Wi-Fi, you will instead need to call `adb reverse tcp:8081 tcp:8081`.

## Running app on iOS

Transport layer not working for iOS but it's possible to run app in watch-only mode. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Install CocoaPods dependencies - `yarn pods` (it's necessary to do this every time native dependencies are changed)
2. Run packager - `yarn start`
3. Open `ios/TrezorSuite.xcworkspace` in Xcode
4. Hit ▶️ `Run` button

## Debugging with Flipper - deprecated

Because of usage of new Fabric architecture, it is not possible to use Chrome debugger anymore. We are compiling our own version of Hermes core with added functions.

Best way how to debug app is download [Flipper](https://fbflipper.com).

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

##### iOS develop

```sh
[bundle exec] fastlane ios develop
```

Push a new beta build to TestFlight for develop build schema.

---

##### iOS staging

```sh
[bundle exec] fastlane ios staging
```

Push a new beta build to TestFlight for staging build schema.

---

##### iOS production

```sh
[bundle exec] fastlane ios production
```

TODO

---

#### Android

##### android develop

```sh
[bundle exec] fastlane android develop
```

Build and upload the app (develop) to Firebase App Distribution for testing in a small group of testers.

---

##### android staging

```sh
[bundle exec] fastlane android staging
```

Build and upload the app (staging) to Google Play Store for internal testing.

---

##### android production

```sh
[bundle exec] fastlane android production
```

Build and upload the app (production) to Google Play Store for internal testing.
