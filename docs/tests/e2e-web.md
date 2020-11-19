# Suite Web e2e tests
Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Trezor-user-env 
[Trezor-user-env](https://github.com/trezor/trezor-user-env) is a docker image which provides all the necessary instrumentation 
required to run test (bridge and emulators).

## run_tests script
The [run_tests.js script](https://github.com/trezor/trezor-suite/blob/develop/packages/integration-tests/projects/suite-web/run_tests.js)
is the entrypoint for e2e tests. It:
- picks tests files to be run (see @tags) 
- retries tests if needed (see @retry)
- reports tests results

## @tags
Each test should be assigned a tag at the top of the test file. Doing so enables run_tests.js script 
to sort the test files into groups and run them in parallel on CI. At the moment these tags exist: 
- `@group:metadata` 
- `@group:device-management`
- `@group:suite`
- `@group:onboarding`
- `@group:browsers`
- `@group:settings`

## @retry
If there is a test that you for any reason need to retry if it fails you may provide `@retry=2` tag. In this 
case, test will be ran 3 times in total and count as failed only if all runs fail. 

## Results
There is a tool to track tests runs and their results, temporarily hosted here https://track-suite.herokuapp.com/
Repo here: https://github.com/mroz22/track-suite

## Debug tests locally

### Suite test

Suite test opens cypress test runner and prepares everything to run tests.

`./docker/docker-suite-test.sh`

Disclaimer: GUI from docker container does not work on mac. Only linux is supported at the moment.

### Image snapshots

It is possible to run tests with image snapshots to test for visual regressions. To enable snapshots, use env variable:

`CYPRESS_SNAPSHOT=1 ./docker/docker-suite-test.sh`
    
# Old notes (to be removed) 

## Notes on bridge (trezord)
Cypress has 2 problems when communicating with trezord. 

1. Does not send request origin headers correctly -> problem with CORS.
1. Tests in CI fail occasionally on POST to '/' with 403 -> problem with CSFR.
1. Change default address to 0.0.0.0 instead of 127.0.0.1 to make it work on mac without any other configuration

As a workaround we have a custom binary compiled from this [trezord branch](https://github.com/trezor/trezord-go/tree/cypress)
