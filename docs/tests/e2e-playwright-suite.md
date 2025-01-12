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

1. **To run just one test file** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e:web general/wallet-discovery.test.ts`

1. **To run just one test** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e:web -g "Basic cardano walkthrough"`

1. **To run one group** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e:web --grep @group=wallet`

1. **To check for flakiness** you can specify test/suite and how many time it should run: `yarn workspace @trezor/suite-desktop-core test:e2e:web general/wallet-discovery.test.ts --repeat-each=10`

1. **To debug test** add `await window.pause();` to place where you want test to stop. Debugger window will open.

1. **To enable Debug Tools in the browser** press `Ctrl+Shift+I`

1. **To enable Electron verbose logging** add env variable LOGLEVEL=debug or any other level

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

### Artifacts on CI

Every Playwright test run contains attached artifact of both Playwright report and docker logs. Download, unpack and show with `yarn playwright show-report ./path/to/report`
