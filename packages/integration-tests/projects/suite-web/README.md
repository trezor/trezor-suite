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

## Debug tests locally

See [docker readme](../../../../docker/README.md)

    