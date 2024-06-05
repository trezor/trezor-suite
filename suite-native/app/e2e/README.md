# Trezor Suite mobile E2E tests

This folder contains Detox E2E tests for the Trezor Suite mobile app. The tests are prepared for both Android (emulator) and iOS (simulator) platforms. It is possible to run them on the local machine in both debug (`expo dev-client`) and release build. There is also a Github CI action prepared running on every mobile app-related pull request.

Detox configuration can be found in the [.detoxrc.js](../.detoxrc.js) file. `jest` is used as the test runner.

The tests Are always executed with the env variable `IS_DETOX_BUILD` equal to `"true"`. So in case you would need to determine if the JS code is running within a test build, you can always access this variable. For example, it is used in a debug build to hide react-native LogBox, so it is not blocking the UI for the test runner.

## Running tests locally

To run the tests locally, you need to have the following installed:

-   for **iOS** build: Installed Xcode with iPhone 11 simulator created
-   for **Android** build: Installed Android Studio with existing emulator device named `Pixel_3a_API_31`. You can do it via Android Studio UI. If you want to do it via the command line, please follow [this guide](https://wix.github.io/Detox/docs/guide/android-dev-env#heres-how-to-install-them-using-the-command-line). You can also use another emulator device, but you have to map its name to the `devices.emulator.device.avdName` value in the `.detoxrc.js` config file.

### Debug build

With the debug config, the app is running in Expo dev-client and the JavaScript bundle is served from the local Metro server. This configuration is suitable for development and testing purposes because the Metro hot reloads make it easy to debug the test scenarios. To run the tests in debug mode, follow these steps:

1. Navigate to the `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a debug build:
    - (**Android**) `yarn build:e2e android.emu.debug`
    - (**iOS**) `yarn build:e2e ios.sim.debug`
4. Run Metro server: `yarn start`
5. While is Metro server running in a different console, execute the E2E tests:
    - (**Android**) `yarn test:e2e android.emu.debug`
    - (**iOS**) `yarn test:e2e ios.sim.debug`

> BEWARE: Sometimes the first execution of debug build fail, because the bundling on the metro server takes longer for the first time. If you encounter this behavior, just rerun the tests and the second run should go smoothly.

### Release build

To test the app in the release mode, you need to build the app with the release configuration. The JavaScript bundle is bundled within the app and the app is running in the standalone mode. To run the tests in the release mode, follow these steps:

1. Navigate to the `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a release build:
    - (**Android**) `yarn build:e2e android.emu.release`
    - (**iOS**) `yarn build:e2e ios.sim.release`
4. Execute the E2E tests:
    - (**Android**) `yarn test:e2e android.emu.release`
    - (**iOS**) `yarn test:e2e ios.sim.release`

### Integration with Trezor-user-env

Some tests use Trezor-user-env to simulate the Trezor device. To make these tests work locally, make sure that the trezor-user-env is up and running. To do so, follow the [trezor-user-env documentation](https://github.com/trezor/trezor-user-env/blob/master/README.md).

## GitHub CI

Android E2E test run on GitHub CI on every PR that is labeled with a `mobile-app` tag. The workflow is described in the [.github/workflows/native-test-e2e-android.yml](../../../.github/workflows/native-test-e2e-android.yml) file.

For easier debugging of failing tests on the CI, the screenshot and screen recording of failed tests are stored as GitHub action artifacts, so you can see how the app behaved and what went wrong.

## FAQ

#### How to open an inspector tools?

1. Shift+M (in terminal where `yarn start` is running)
2. Select Open React Devtool
3. `adb reverse tcp:8097 tcp:8097`

#### How to run only one test?

Add filepath to the command e.g. `yarn test:e2e android.emu.debug ./e2e/tests/accountManagement.test.ts`

#### How to make prebuild for one platform only?

`yarn prebuild:clean --platform android`

#### How to find testIDs for screens?

TestIDs follow patter `@screen/${routeName}`. For `routeName` check a file `suite-native/navigation/src/routes.ts`.
