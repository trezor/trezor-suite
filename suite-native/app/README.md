# @suite-native/app

Trezor Suite native application.

## Prerequisites

Generally it's recommended to follow official [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) guide.

1. [Android Guide](https://reactnative.dev/docs/set-up-your-environment?os=macos&platform=android)
    - If you have Linux, install `watchman` preferably using Homebrew (others methods seem to be unmaintained)
2. [iOS Guide](https://reactnative.dev/docs/set-up-your-environment?os=macos&platform=ios)
    - Make sure you have the latest version of the Xcode command line tools installed: `xcode-select --install`

## Before you run the app

1. Run `yarn native:prebuild:clean` to generate `ios/` and `android/` directories.
    - You can prebuild for specific platform if you setup only Android/iOS: `yarn prebuild:clean --platform [android|ios]`
    - It's necessary to re-run faster version of this command `yarn native:prebuild` (shortcut `yarn p`) on any change in native code (when you change branch/pull/rebase).

## Running app on Android

1. Connect device or run emulator.
    - For a physical device, it's recommended to use [adb over wifi](https://developer.android.com/studio/command-line/adb#connect-to-a-device-over-wi-fi-android-11+) because you will have free up a USB port to connect Trezor device.
2. Run packager - `yarn native:start` in separate terminal window and keep it running
3. Run native build - `yarn native:android` this takes time (~10min) and it should install and start the app at the end
4. With emulator running, reverse android emulator ports to enable communication between the app and localhost services - `yarn native:reverse-ports`

## Running app on iOS

You need a Mac to be able to run iOS app.

Trezor can't be connected to iOS device via cable but it's possible to use Portfolio tracker feature for watch only wallets. You will need Xcode and [xcode-select](https://www.freecodecamp.org/news/install-xcode-command-line-tools/).

1. Run packager - `yarn native:start`
1. Run `yarn native:ios` to build and run the app on iOS simulator/device

Or via Xcode (for native errors debug):

1. Open `suite-native/app/ios/TrezorSuite.xcworkspace` in Xcode (from cli `xed suite-native/app/ios`)
1. Hit ▶️ `Run` button

It is also possible for development purposes to connect Trezor emulator to iOS simulator (not physical device) if you turn on the feature flag `Connect device` in DEV utils.

## Aliases

You can use shorter versions of previous script commands OR navigate to suite-native/app folder and run scripts from there.

Aliases available in root folder:

-   `yarn s` = yarn native:start
-   `yarn p` = yarn native:prebuild
-   `yarn ports` = yarn native:reverse-ports
-   `yarn a` = yarn native:android
-   `yarn ios` = yarn native:ios

## DEV utils

You can show DEV utils on production build FOR DEVELOPMENT PURPOSES ONLY – do not use it for your personal wallets!

To reveal dev menu, you have to click at least 7 times on commit hash at the bottom of About Trezor Suite Lite page.

## Environment variables

How our ENV variables works is describe in [Environment variables in Expo](https://docs.expo.dev/guides/environment-variables/) documentation.

ENV variables for each Expo profile are defined in `eas.json` config.

You can override ENV variables locally using `.env.development.local` (or `.env.test.local` for tests) files. If you use `.env` file, it has the lowest priority. See [what other .env\* files you can use](https://github.com/bkeepers/dotenv/blob/c6e583a/README.md#what-other-env-files-can-i-use).

> You can use `EXPO_PUBLIC_IS_ANALYTICS_LOGGER_ENABLED=true` in `.env.development.local` to debug analytics locally.

## Troubleshooting

1. For any issues with the build, try to clean the project and rebuild it:
    - `yarn native:prebuild:clean`
    - `yarn native:android` or `yarn native:ios`
2. In case of issues with the packager, try to restart it with `--reset-cache` i.e (`yarn s --reset-cache`).
3. Sometimes it's helpful to combine two previous points with uninstalling the app from the device/emulator.
4. Make sure you are using pure Node or `nvm` for managing node version (other version managers like `fnm` can cause build issues on iOS).
5. `npx react-native doctor` may help to identify issues with your environment, though not every check _has_ to pass
