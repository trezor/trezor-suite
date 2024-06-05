# @suite-native/app

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
1. Reverse android emulator ports to enable communication between the app and localhost services - `yarn reverse-ports`
1. Run packager - `yarn start`

## Running app on iOS

Transport layer not working for iOS but it's possible to run app in watch-only mode. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Install CocoaPods dependencies - `yarn pods` (it's necessary to do this every time native dependencies are changed)
2. Run packager - `yarn start`
3. Open `ios/TrezorSuite.xcworkspace` in Xcode
4. Hit ▶️ `Run` button

### Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```
