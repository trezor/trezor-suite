# Suite Web e2e tests
Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Trezor-user-env 
[Trezor-user-env](https://github.com/trezor/trezor-user-env) is a docker image that provides all the necessary instrumentation 
required to run test (bridge and emulators).

## run_tests script
The [run_tests.js script](https://github.com/trezor/trezor-suite/blob/develop/packages/integration-tests/projects/suite-web/run_tests.js)
is the entry point for e2e tests. It:
- picks tests files to be run (see @tags) 
- retries tests if needed (see @retry)
- reports tests results

## tags
Each test should be assigned a tag at the top of the test file. These allow you to add more fine-grained control 
in run_tests.js. 

At the moment, there are the following tags:
- @group:[string] 
- @retry=[number]

### @group
Assigning a @group allows run_tests.js script to sort the test files into groups and run them in parallel on CI. At the moment these groups exist: 
- `@group:metadata` 
- `@group:device-management`
- `@group:suite`
- `@group:onboarding`
- `@group:settings`

### @retry
If there is a test that you for any reason need to retry if it fails you may provide `@retry=2` tag. In this 
case, test will be run 3 times in total and count as failed only if all runs fail. 

## Results
There is a tool to track tests runs and their results, temporarily hosted here https://track-suite.herokuapp.com/
Repo here: https://github.com/mroz22/track-suite

## Debug tests locally

### Suite test

Suite test opens cypress test runner and prepares everything to run tests.

`./docker/docker-suite-test.sh`

### Image snapshots

It is possible to run tests with image snapshots to test for visual regressions. To enable snapshots, use env variable:

`CYPRESS_SNAPSHOT=1 ./docker/docker-suite-test.sh`

When you need to update image snapshots you have 2 options:
- use CI job. This will generate new snapshots in artifacts together with a handy script that updates your snapshots locally. Check the log output. 
- use `./docker/docker-suite-snapshots.sh`. This does the same as `./docker/docker-suite-test.sh`, the only difference is it won't fail on non-matching snapshots but generate new snapshots.
## Notes

### Running e2e tests locally on macOS

#### Prerequisites

- [Docker](https://docs.docker.com/docker-for-mac/install/) (to run NixOS in a container)
- [XQuartz](https://www.xquartz.org/) (to share your screen with Docker)

#### Steps

1. Run XQuartz. Leave it running on the background. Wait till it is launched.
2. In XQuartz settings go to Preferences > Security and enable "Allow connections from network clients".
3. Open a new terminal window (not in XQuartz) and add yourself to the X access control list: 
   - `xhost +127.0.0.1` 
   - You will probably need to logout/login after XQuartz installation to have `xhost` command available.
4. Run Docker and go to Preferences->Resources->Advanced and increase RAM to at least 4GB. Otherwise, the app during tests does not even load.
5. In terminal window use:
   - ``
./docker/docker-suite-install.sh
``
6. In the terminal window, set two environment variables:

   - ``
export HOSTNAME=`hostname`
``

   - ``
export DISPLAY=${HOSTNAME}:0
``

7. In terminal window use:
   - ``
./docker/docker-suite-test.sh
``
      - A Cypress window should open.
      - Wait until the project is built (a warning about "http://localhost:3000/ is not available", should disappear on the retry button click).
8. Run tests.
   - It should open a browser window.
   - If the Suite web app is not loading even after two retries. Stop tests, open a new tab, navigate to http://localhost:3000/, refresh the page until the app is loaded. Close the tab and run tests again.

#### Troubleshooting
- `[...ERROR:browser_main_loop.cc(1434)] Unable to open X display.`
   - Make sure the XQuartz app is launched and you can see its terminal.
   - Check that environment variables are properly set:
      - ``
echo $HOSTNAME # e.g. name.local
``
      - ``
echo $DISPLAY # e.g. name.local:0
``
   - Do not mix native terminal window with terminal window in Visual Studio Code.
