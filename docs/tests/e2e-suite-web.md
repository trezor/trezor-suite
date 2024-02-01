# @trezor/suite-web e2e tests

@trezor/suite-web uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests. It also uses [trezor-user-env](https://github.com/trezor/trezor-user-env) which is [daily built](https://gitlab.com/satoshilabs/trezor/trezor-user-env/-/pipelines) into a docker image providing all the necessary instrumentation required to run tests (bridge and emulators).

## Run it locally

_Note: All paths below are relative to the root of trezor-suite repository, if not specified otherwise._

### On Linux

#### Prerequisites

-   [Docker](https://docs.docker.com/engine/install/)

#### Steps

1. Run `xhost +` to add yourself to the X access control list.
1. Run `docker/docker-suite-install.sh`.
1. Run `docker/docker-suite-test.sh`.
    - A Cypress window should open.
    - Wait until the project is built (a warning about "http://localhost:8000/ is not available", should disappear on the retry button click).
1. Start a test by clicking its name in the Cypress window.
    - It should open a browser window.
    - If the Suite web app is not loading even after two retries. Stop tests, open a new tab, navigate to http://localhost:8000/, refresh the page until the app is loaded. Close the tab and run tests again.

#### Troubleshooting

-   `Error while fetching server API version: ('Connection aborted.', FileNotFoundError(2, 'No such file or directory'))`
    -   On NixOS: Make sure that docker is enabled in your configuration.nix:\
        `virtualisation.docker.enable = true;`
-   `Error while fetching server API version: ('Connection aborted.', PermissionError(13, 'Permission denied'))` - Check the docker.sock permissions:\
     `sudo chmod 666 /var/run/docker.sock`

### On MacOS (Intel)

#### Prerequisites

-   [Docker](https://docs.docker.com/desktop/mac/install/)
-   [XQuartz](https://www.xquartz.org/) (to share your screen with Docker)

#### Steps

1. Run XQuartz. Wait till it is launched. Leave it running in the background.
1. In XQuartz settings go to Preferences -> Security and enable "Allow connections from network clients".
1. Open a new terminal window (not in XQuartz) and add yourself to the X access control list:
    - `xhost +127.0.0.1`
    - You will probably need to logout/login after XQuartz installation to have `xhost` command available.
1. Run Docker and go to Preferences -> Resources -> Advanced and increase RAM to at least 4GB. Otherwise, the app during tests does not even load.
1. In terminal window run `docker/docker-suite-install.sh`
1. In the terminal window, set two environment variables:
    - `` export HOSTNAME=`hostname` ``
    - `export DISPLAY=${HOSTNAME}:0`
1. In terminal window run `docker/docker-suite-test.sh`
    - A Cypress window should open.
    - Wait until the project is built (a warning about "http://localhost:8000/ is not available", should disappear on the retry button click).
1. Start a test by clicking its name in the Cypress window.
    - It should open a browser window.
    - If the Suite web app is not loading even after two retries. Stop tests, open a new tab, navigate to http://localhost:8000/, refresh the page until the app is loaded. Close the tab and run tests again.

#### Troubleshooting

-   `[...ERROR:browser_main_loop.cc(1434)] Unable to open X display.`
    -   Make sure the XQuartz app is launched and you can see its terminal.
    -   Check that environment variables are properly set:
        -   `echo $HOSTNAME # e.g. name.local`
        -   `echo $DISPLAY # e.g. name.local:0`
    -   Do not mix native terminal window with terminal window in your IDE (e.g. Visual Studio Code).

### On MacOS (ARM)

-   currently, it is not possible to run E2E tests only within a Docker container on ARM mac. With `Trezor-user-env` run in Docker, it is possible to run `Suite` and `Cypress` locally.

#### Prerequisites

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
1. In another window, run web `Suite` with `yarn suite:dev`.
1. In a third window, run `npx cypress open --project packages/suite-web/e2e --config 'baseUrl=http://localhost:8000'`.

#### Troubleshooting

-   `Cypress could not verify that this server is running ...`
    -   make sure that the localhost is actually running and is accessible via browser
-   `tests fail at the very beginning on screen with "Use trezor here" button`
    -   make sure that no other instance of `Suite` or `trezord` is running

---

## Notes

### Image snapshots

It is possible to run tests with image snapshots to test for visual regressions. To enable snapshots, use env variable:

`CYPRESS_SNAPSHOT=1 docker/docker-suite-test.sh`

When you need to update image snapshots you have 2 options:

-   use CI job. This will generate new snapshots in artifacts together with a handy script that updates your snapshots locally. Check the log output.
-   use `docker/docker-suite-snapshots.sh`. This does the same as `docker/docker-suite-test.sh`, the only difference is it won't fail on non-matching snapshots but generate new snapshots.

### run_tests script

The [run_tests.js script](../../packages/suite-web/e2e/run_tests.ts)
is the entry point for e2e tests. It:

-   picks tests files to be run (see @tags)
-   retries tests if needed (see @retry)
-   reports tests results

### tags

Each test should be assigned a tag at the top of the test file. These allow you to add more fine-grained control
in run_tests.js.

At the moment, there are the following tags:

-   @group:[string]
-   @retry=[number]

#### @group

Assigning a @group allows run_tests.js script to sort the test files into groups and run them in parallel on CI. At the moment these groups exist:

-   `@group:metadata`
-   `@group:device-management`
-   `@group:suite`
-   `@group:settings`

#### @retry

If there is a test that you for any reason need to retry if it fails you may provide `@retry=2` tag. In this
case, test will be run 3 times in total and count as failed only if all runs fail.

### Results

There is a tool to track tests runs and their results, temporarily hosted here https://track-suite.herokuapp.com/
Repo here: https://github.com/mroz22/track-suite
