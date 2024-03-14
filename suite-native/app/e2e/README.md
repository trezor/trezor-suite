# Trezor Suite mobile E2E tests

This folder contains Detox E2E tests for Trezor Suite mobile app. The tests are prepared for both Android (emulator) and iOS (simulator) platforms. It is possible to run them on local machine in both debug (expo dev-client) and release build. There is also prepared Github CI action (TODO: add link) running them.

Detox configuration can be found in the [.detoxrc.js](../.detoxrc.js) file. `jest` is used as the test runner.

## Running tests locally

To run the tests locally, you need to have the following installed:

-   for **iOS** build: Installed Xcode with existing iphone
-   for **Android** build: Installed Android Studio with existing android emulator device named `Pixel_3a_API_31`. You can also use another emulator device, but you have to map its name to the `devices.emulator.device.avdName` value in the `.detoxrc.js` config file.

### Debug build

With the debug config, the app is running in Expo dev-client and the JavaScript bundle is served from the local machine Metro server. This configuration is suitable for development and testing purposes, because the Metro hot reload make it easy to debug the test scenarios. To run the tests in debug mode, follow these steps:

1. Navigate to `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a debug build:
    - (**Android**) `yarn build:e2e android.emu.debug`
    - (**iOS**) `yarn build:e2e ios.sim.debug`
4. Run Metro server: `yarn start`
5. While is Metro server running in a different console, execute the E2E tests:
    - (**Android**) `yarn test:e2e android.emu.debug`
    - (**iOS**) `yarn test:e2e ios.sim.debug`

### Release build

To test the app in the release mode, you need to build the app with the release configuration. The JavaScript bundle is bundled with the app and the app is running in the standalone mode. To run the tests in the release mode, follow these steps:

1. Navigate to `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a release build:
    - (**Android**) `yarn build:e2e android.emu.release`
    - (**iOS**) `yarn build:e2e ios.sim.release`
4. Execute the E2E tests:
    - (**Android**) `yarn test:e2e android.emu.release`
    - (**iOS**) `yarn test:e2e ios.sim.release`

### Integration with Trezor-user-env

There are some tests that are using Trezor-user-env to simulate the Trezor device. To make these these test work locally, make sure that the trezor-user-env is up and running. To do so, follow the [trezor-user-env documentation](https://github.com/trezor/trezor-user-env/blob/master/README.md).

## Github CI

Android E2E test run on Github CI on every PR that is labeled with `mobile-app` tag. The workflow is described in the [.github/workflows/e2e-android.yml](../../../.github/workflows/mobile-e2e-android.yml) file.
