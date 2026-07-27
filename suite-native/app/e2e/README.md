# Trezor Suite mobile E2E tests

This folder contains Detox E2E tests for the Trezor Suite mobile app. The tests are prepared for both Android (emulator) and iOS (simulator) platforms. It is possible to run them on the local machine in both debug (`expo dev-client`) and release build. There is also a Github CI action prepared running on every mobile app-related pull request.

Detox configuration can be found in the [.detoxrc.js](../.detoxrc.js) file. `jest` is used as the test runner.

If you need to determine if the JS code is running within a test build, you can use `isDetoxTestBuild()` util. For example, it is used in a debug build to hide react-native LogBox, so it is not blocking the UI for the test runner.

## Running tests locally

To run the tests locally, you need to have the following installed:

- for **iOS** build:
    - Installed Xcode with iPhone 11 simulator created
    - Installed applesimutils with `brew tap wix/brew && brew install applesimutils`

- for **Android** build: Installed Android Studio with existing emulator device named `Pixel_6_API_34`. You can do it via Android Studio UI. If you want to do it via the command line, please follow [this guide](https://wix.github.io/Detox/docs/guide/android-dev-env#heres-how-to-install-them-using-the-command-line). You can also use another emulator device, but you have to map its name to the `devices.emulator.device.avdName` value in the `.detoxrc.js` config file.

### Debug build

With the debug config, the app is running in Expo dev-client and the JavaScript bundle is served from the local Metro server. This configuration is suitable for development and testing purposes because the Metro hot reloads make it easy to debug the test scenarios. To run the tests in debug mode, follow these steps:

1. Navigate to the `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a debug build:
    - (**Android**) `yarn build:e2e android.emu.debug`
    - (**iOS**) `yarn build:e2e ios.sim.debug`
4. Run Metro server using test ENV variables from `.evn.test`: `yarn start:e2e`
5. While is Metro server running in a different console, execute the E2E tests:
    - (**Android**) `yarn test:e2e:android`
    - (**iOS**) `yarn test:e2e:ios`

> BEWARE: Sometimes the first execution of debug build fail, because the bundling on the metro server takes longer for the first time. If you encounter this behavior, just rerun the tests and the second run should go smoothly.

### Release build

To test the app in the release mode, you need to build the app with the release configuration. The JavaScript bundle is bundled within the app and the app is running in the standalone mode. To run the tests in the release mode, follow these steps:

1. Navigate to the `suite-native/app` folder
2. generate Expo native code with `yarn prebuild:clean`
3. Create a release build:
    - (**Android**) `yarn build:e2e android.emu.release`
    - (**iOS**) `yarn build:e2e ios.sim.release`
4. Execute the E2E tests:
    - (**Android**) `yarn test:e2e --config e2e/trezorDetoxRunner/config/runner-android-release.config.js`
    - (**iOS**) `yarn test:e2e --config e2e/trezorDetoxRunner/config/runner-ios-release.config.js`

> Note: For release builds, you must provide the full path to the release runner configuration.

### Custom Runner Arguments

The `detoxRunner.ts` supports several arguments to control the test execution:

- `--config <path>`: (Required) Path to the runner config file.
- `[testFiles]`: Space-separated list of test files to run. If provided, only these files will be executed.
- `--project <name>`: Project name to run (can be specified multiple times). If not specified, all projects in the config are run.
- `--shard <n>`: Current shard index (0-based).
- `--totalShards <n>`: Total number of shards.
- `--headless`: Run tests in headless mode (Android only).
- `--help`: Show help message.

> Note: Sharding arguments (`--shard` and `--totalShards`) cannot be used together with specific test files.

### Integration with Trezor-user-env

Some tests use Trezor-user-env to simulate the Trezor device. To make these tests work locally, make sure that the trezor-user-env is up and running. To do so, follow the [trezor-user-env documentation](https://github.com/trezor/trezor-user-env/blob/master/README.md).

### Running trading tests locally

To run trading tests, you need to have passphrase wallet on `mnemonic_academic` with some ETH for fees and at least 10 USDC on Ethereum.

Specify passphrase in the `suite-native/app/e2e/.env` as `TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE` env variable.

### Device model and FW version

The Device model and FW version is defined in the custom detox runner config. This config defines projects for each device (similarly as in PW E2E tests). If you want to locally run tests against just one specific device, you can do that by selecting the corresponding project.
`yarn test:e2e:android --project=T3T1`

## Test tagging

Since Detox/Jest doesn't natively support test tagging, we are using a common convention to achieve this goal. Tags are added as part of the test describe or test name. Tags are to be prefixed with @ and and wrapped in [] parentheses.
Example:

```typescript
describe('Tests with T3T1 device model [@T3T1]', () => {
    test('Enable, change & disable PIN [@androidOnly]')
}
```

## Working with Launch Arguments

You can pass launch arguments to the app when running tests. This is useful for testing specific scenarios. To do so you can pass arbitrary arguments via `openApp` or `restartApp` util functions.

```
 await openApp({ newInstance: true, args: { myArg: 'myValue' } });
```

then you can access the arguments in the app using `launchArguments` constant from `@suite-native/config`

```
 import { launchArguments } from '@suite-native/config';

 const myArg = launchArguments.myArg; // 'myValue'
```

### Adding a New Argument

- Update type definitions in the [@suite-native/config/src/launch-arguments](../../config/src/launch-arguments.ts) to secure type safety.

```

export type LaunchArguments = {
    myArg?: string;
    // ... other arguments
};
```

- if you want to set a default value for the argument, update `INITIAL_LAUNCH_ARGS` in [e2e util file](./utils.ts)

## Working with E2E-Specific Files

- If you need to render different components or screens in the E2E tests, use `e2e` suffix, e.g `MyComponent.e2e.tsx`. This file will be used only in the `E2E` tests and will not affect the production code.

## Mocking

To make the tests as much standalone and independent on third party services as possible, we are mocking some parts of the app. The mocks are located in the `/mocks` folder.

## GitHub CI

Android E2E test run on GitHub CI on every PR that is labeled with a `mobile-app` tag. The workflow is described in the [.github/workflows/native-test-e2e-android.yml](../../../.github/workflows/native-test-e2e-android.yml) file.

For easier debugging of failing tests on the CI, the screenshot and screen recording of failed tests are stored as GitHub action artifacts, so you can see how the app behaved and what went wrong.

## FAQ

#### How to open an inspector tools?

1. Shift+M (in terminal where `yarn start` is running)
2. Select Open React Devtool
3. `adb reverse tcp:8097 tcp:8097`

#### How to run only one test?

**Local run**

Pass the file path(s) to the command:
`yarn test:e2e:android e2e/tests/accountManagement.test.ts`

**CI run (Advanced)**

To run specific files in CI you can temporarily change the GH workflow `template-suite-native-e2e-android.yml` and pass the file path(s) to the command. e.g. `yarn test:e2e --config=e2e/trezorDetoxRunner/config/runner-android-release.config.js --shard=${{ matrix.TEST_GROUP }} --totalShards=4 --headles e2e/tests/accountManagement.test.ts`

#### How to make prebuild for one platform only?

`yarn prebuild:clean --platform android`

#### How to find testIDs for screens?

TestIDs follow patter `@screen/${routeName}`. For `routeName` check a file `suite-native/navigation/src/routes.ts`.
