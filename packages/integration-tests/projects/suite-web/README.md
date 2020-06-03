# Suite Web tests

Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Trezor-user-env 

Trezor-user-env is a docker image located in `/docker/trezor-env` which provides all the necessary instrumentation 
need to run test (bridge and emulators). Basically it should mock users environment.

## Notes on bridge (trezord)

Cypress has 2 troubles when communicating with trezord. 

1. Does not send request origin headers correctly -> problem with CORS.
1. Tests in CI fail occasionally on POST to '/' with 403 -> problem with CSFR.
1. Change default address to 0.0.0.0 instead of 127.0.0.1 to make it work on mac without any other configuration

As a workaround we have a custom binary compiled from this [trezord branch](https://github.com/trezor/trezord-go/tree/cypress)

## Labels

### @beta|@stable
Each test should be assigned either `@beta` or `@stable` label at the top of test file. If you create a new file 
or do major changes to already existing one, it should be assigned `@beta`. Beta tests do not cause CI to fail and 
are ran only to get statistics and discover possible flakiness. Results should be observed in Track Suite app. 
Once tests appear to be stable you should give them `@stable` label.

### @retry=<number>
If there is a test that you for any reason need to retry if it fails you may provide `@retry=2` option. In this 
case, test will be ran 3 times in total and account as failed only if all runs fail. 

## Track Suite
There is a tool to track tests runs and their results, temporarily hosted here https://track-suite.herokuapp.com/
Repo here: https://github.com/mroz22/track-suite

## Debug tests locally

See [docker readme](../../../../docker/README.md)

    