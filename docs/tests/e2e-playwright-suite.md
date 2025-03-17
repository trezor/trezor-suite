# @trezor/suite-desktop and @trezor/suite-web e2e tests

@trezor/suite uses [Playwright](https://playwright.dev/) to run e2e tests. It also uses [trezor-user-env](https://github.com/trezor/trezor-user-env) which is [daily built](https://gitlab.com/satoshilabs/trezor/trezor-user-env/-/pipelines) into a docker image providing all the necessary instrumentation required to run tests (bridge and emulators).

## Run it locally

_Note: All paths below are relative to the root of trezor-suite repository, if not specified otherwise._

### Common

-   [Docker](https://docs.docker.com/desktop/mac/install/)
-   [XQuartz](https://www.xquartz.org/) (to share your screen with Docker)
-   [Trezor user env](https://github.com/trezor/trezor-user-env)
-   No other instance of `Suite` or `trezord` service is running

Steps:

1. Run XQuartz. Wait till it is launched. Leave it running in the background.
1. In XQuartz settings go to Preferences -> Security and enable "Allow connections from network clients".
1. Open a new terminal window (not in XQuartz) and add yourself to the X access control list:
    - `xhost +127.0.0.1`
    - You will probably need to logout/login after XQuartz installation to have `xhost` command available.
1. Run Docker and go to Preferences -> Resources -> Advanced and increase RAM to at least 4GB. Otherwise, the app during tests does not even load.
1. In the terminal window, set two environment variables:
    - ``export HOSTNAME=`hostname` ``
    - `export DISPLAY=${HOSTNAME}:0`
1. In terminal window, navigate to `trezor-user-env` repo root and run `./run.sh`.
1. In workspace `packages/suite-desktop-core` create a `.env` file according to the `.example.env`

### Web

1. In another window, run web `Suite` with `yarn suite:dev`.
1. In a third window, run `yarn workspace @trezor/suite-desktop-core test:e2e:web`.

### Desktop

1. `yarn workspace @trezor/suite-desktop build:ui`

    Produces `suite-desktop/build` directory with javascript bundles in production mode.

    _Note: This step needs to be repeated on each change in suite-desktop-ui package._

1. `yarn workspace @trezor/suite-desktop build:app`

    Produces `suite-desktop/dist` directory with javascript bundles in production mode and application assets.

    _Note: This step needs to be repeated on each change in suite-desktop-core package._

1. `yarn workspace @trezor/suite-desktop-core test:e2e:desktop`

#### Troubleshooting

1. **To run both Web and Desktop at same time** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e`

1. **To run tests headed (showing UI)** you can add: `--headed --ignore-snapshots`. Some snapshots differ between headless and headed mode, ergo we need to ignore them when running in headed mode.

1. **To run just one test file** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e general/wallet-discovery.test.ts`

1. **To run just one test** you can add: `-g "Basic cardano walkthrough"`

1. **To run one group** you can add: `--grep @group=wallet`

1. **To open advance debug ui** you can add: `--ui`

1. **To check for flakiness** you can specify test/suite and how many time it should run: `--repeat-each=10`

1. **To debug test** add `await window.pause();` to place where you want test to stop. Debugger window will open. This works only in `--headed` run.

1. **To enable Debug Tools in the browser** press `Ctrl+Shift+I`

1. **To enable Electron verbose logging** add env variable LOGLEVEL=debug or any other level

1. **To increase test timeouts** when your local run exceed 1m limit, you can specify test timeout override in `packages/suite-desktop-core/.env`. (UI runner --ui needs to be restarted to reflect the change in `.env`)

1. **To run with x-main firmware** instead of x-latest you can use CANARY_FIRMWARE env variable like this: `CANARY_FIRMWARE=true yarn workspace @trezor/suite-desktop-core test:e2e`

## Contribution

Please follow our general [Playwright contribution guide](e2e-playwright-contribution-guide.md)

### Tags

Each test should be assigned a tag

At the moment, there are the following tags:

-   @group=[string]
-   @desktopOnly
-   @webOnly
-   @snapshot

#### @group

Assigning a @group allows test runner to run the groups in parallel on CI. At the moment these groups exist:

-   `@group=wallet`
-   `@group=settings`

#### @desktopOnly or @webOnly

Some tests are only applicable for Desktop app or Web and you can use this tag to notify the runner, that the test should be ignored when running against opposite Suite.

#### @snapshot

Some tests are using visual regression comparison by comparing specific element with a prerecorded snapshot or by comparing Aria snapshot. This tag serve for easier updating of snapshots and monitoring.

### Updating snapshots

Changes in implementation or environment may demand updating our Aria snapshots or prerecorded image snapshots that serve for visual regression comparison. To do so:

1. Run `yarn test:e2e:update-snapshots`, this will run all tests with @snapshot tag and record new snapshots if there is difference.
    - Alternatively, you can run `yarn test:e2e <filter one specific test or test file> --update-snapshots` to run even smaller amount of tests and to do a update just for that test or test file.
1. Once these tests finish, you will be presented with results which may contain diff patch files of Aria snapshots like in this example:

```
$ yarn test:e2e ios --update-snapshots

Running 1 test using 1 worker

  ✓  1 …wser › Suite does not support iOS @group=other @webOnly @snapshot (5.7s)

New baselines created for:

  e2e/tests/browser/ios.test.ts

  git apply e2e/test-results/rebaselines.patch

  1 passed (6.4s)

To open last HTML report run:

  yarn playwright show-report
```

1. Apply all patches and review that aria snapshot changes. In above example it would be `git apply e2e/test-results/rebaselines.patch`
1. Review all new image snapshots that were generated by the first step. They are automatically stored in `packages/suite-desktop-core/e2e/snapshots` folder and should be visible in your `git status`.
1. Add, commit, and create PR

## Results

### Currents.dev

Test reports are uploaded to [currents.dev](https://app.currents.dev/)
