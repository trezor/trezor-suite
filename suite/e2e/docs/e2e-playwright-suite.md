# @trezor/suite-desktop and @trezor/suite-web e2e tests

@suite/e2e uses [Playwright](https://playwright.dev/) to run e2e tests. It also uses [trezor-user-env](https://github.com/trezor/trezor-user-env) which is [daily built](https://ghcr.io/trezor/trezor-user-env) into a docker image providing all the necessary instrumentation required to run tests (bridge and emulators).

## Run it locally

_Note: All paths below are relative to the root of trezor-suite repository, if not specified otherwise._

### Prerequisites

- [Docker](https://docs.docker.com/desktop/mac/install/)
- [Trezor user env](https://github.com/trezor/trezor-user-env)
- No other instance of `Suite` or `trezord` service is running

### Common steps

1. _macOS only:_ Run Docker and go to Preferences -> Resources -> Advanced and increase RAM to at least 4GB. Otherwise, the app during tests does not even load.
1. In terminal window, navigate to `trezor-user-env` repo root and run `./run.sh`.
1. In another terminal window, run `yarn workspace @trezor/suite-e2e docker:suite-sync` to have local Relay server instance
1. In workspace `@trezor/suite-e2e` create a `.env` file according to the `.example.env`

### Web

1. In another terminal window, run web `Suite` with `yarn suite:dev`.
1. In another terminal window, run `yarn workspace @trezor/suite-e2e test:e2e:web`.

### Desktop

1. `TEST_BUILD=true yarn workspace @trezor/suite-desktop build:ui`

    Produces `suite-desktop/build` directory with javascript bundles & assets in production mode for the electron-renderer process.
    TEST_BUILD env variable serves to mock bundled message-system config .

    _Note: This step needs to be repeated on each change in `suite` or `suite-desktop-ui` package._

1. `yarn workspace @trezor/suite-desktop build:app`

    Produces `suite-desktop/dist` directory with javascript bundles & assets in production mode for the electron-main process.

    _Note: This step needs to be repeated on each change in `connect` or `suite-desktop-core` package._

1. `yarn workspace @trezor/suite-e2e test:e2e:desktop`

#### Troubleshooting

1. **To run tests headed (showing UI)** you can add: `--headed`.

1. **To run just one test file** you can do: `yarn workspace @trezor/suite-e2e test:e2e:web general/wallet-discovery.test.ts` or `yarn workspace @trezor/suite-e2e test:e2e:desktop general/wallet-discovery.test.ts`

1. **To run just one test** you can add: `-g "Basic cardano walkthrough"`

1. **To run on a specific device model** you can only run the device specific project i.e.: `yarn workspace @trezor/suite-e2e test:e2e:web --project=T3T1 general/wallet-discovery.test.ts`

1. **To run tests with canary FW** you need to use canary yarn script i.e. `yarn workspace @trezor/suite-e2e test:e2e:web:canary general/wallet-discovery.test.ts`

1. **To open advance playwright runner/debugger ui** you can add: `--ui`

1. **To check for flakiness** you can specify test/suite and how many time it should run: `--repeat-each=10`

1. **To check for flakiness on CI** you can edit in `packages/suite/package.json` script `"test:orchestrated:e2e:desktop": "NODE_OPTIONS='--no-warnings=DEP0040' yarn xvfb-maybe -- pwc-p --config=./playwright-config/playwright-desktop-nightly.config.ts --repeat-each=30 --grep=<test-file-name>",`, commit, push and run this CI against your branch. This will run this one test 30 times. Please, always specify limited number of tests, never run full suite 30 times.

1. **To debug test** add `await page.pause();` to place where you want test to stop. Debugger window will open. This works only in `--headed` run.

1. **To enable Debug Tools in the browser** press `Ctrl+Shift+I`

1. **To enable Electron verbose logging** add env variable LOGLEVEL=debug or any other level

1. **To increase test timeouts** when your local run exceed 1m limit, you can specify test timeout override in `packages/suite/.env`. (UI runner --ui needs to be restarted to reflect the change in `.env`)

1. **To find a breaking commit in develop** you can checkout latest develop and run `yarn workspace @trezor/suite-desktop git:bisect <last_good_commit> <desktop|web> <test_file>`

## Contribution

Please follow our general [Playwright contribution guide](e2e-playwright-contribution-guide.md)

### Tags

Each test must be assigned a tag according to what device model it is supported by the test i.e.

- @T1B1
- @T2T1
- @T3B1
- @T3T1
- @T3W1
- @noDevice

At the moment, there are these additional tags:

- @smoke
- @desktopOnly
- @webOnly
- @nightlyOnly
- @specificFirmware
- @firmware-ready

#### @smoke

Tests belonging to a smoke set are executed on all supported devices in PR pipelines. Otherwise only T3W1 is used.

#### @desktopOnly or @webOnly

Some tests are only applicable for Desktop app or Web and you can use this tag to notify the runner, that the test should be ignored when running against opposite Suite. This negative filtering is done on playwright-config level.

Currently, we are also applying @webOnly as a positive filter on Web PR runs. This is done in Web PR workflow definition. Meaning, Web PR runs execute only tests with @WebOnly tag to reduce amount of test run daily and save quota on Currents, where we are paying extra for any test runs over 100 000.

#### @nightlyOnly

Some tests should run on nighty runs only for specific reasons. This tags is used for reversed filtering in PR and release workflows definitions. This means tests with this tags will run only on nightly and canary runs.

#### @specificFirmware

Some tests must run on specific Firmware version. That version is setup and defined in test. This tag lets our runner know, that this test should not be included in Canary nightly run.

#### @firmware-ready

This tag server for easier test quarantine. This tag si dedicated to few tests that are guarding against firmware update issues. As such those tests start failing on every firmware release until we adopt new firmware to out Trezor User Env

## Results

Results contains traces, metadata, logs, screenshots, videos and various useful information for debugging.
Traces contain electron logs of our desktop suit app. Both in CI, currents and local env (`suite/e2e/test-results`).
CI runs have artifact with logs from `trezor-user-env`. They exist per group. Log are separated by Log entry `- - - STARTING TEST trading/swap-tokens.test.ts` and `- - - FINISHING TEST trading/swap-tokens.test.ts`

- electrum-regtest.txt
- trezor-user-env-debugging.log
- tenv-emulator-bridge-debugging.log
- trezor-user-env-version.txt
- quota-db.txt
- suite-sync.txt

### Local Relay Server

The local relay server is used by the Suite Sync automation and its test suite to provide an isolated, controllable endpoint and deterministic test data. Each test start by restarting the server and wiping its data store, so do not expect data to persist between test runs. After a test run finishes, the data remains on the server for troubleshooting until the next setup wipe. The server runs from a Docker image pulled from a tagged image in our GitHub repository. Those images are build as part of Suite Sync server pipelines

- Relay: http://localhost:4000
- Quota manager: http://localhost:4001
- Health check: http://localhost:4002

### Currents.dev

Test reports are uploaded to [currents.dev](https://app.currents.dev/)
