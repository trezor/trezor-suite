# Suite Web tests

Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Trezor-env 

Trezor-env is a docker image located in `/docker/trezor-env` which provides all the necessary instrumentation 
need to run test (bridge and emulators)

## Notes on bridge (trezord)

Cypress has 2 troubles when communicating with trezord. 

1. Does not send request origin headers correctly -> problem with CORS.
1. Tests in CI fail occasionally on POST to '/' with 403 -> problem with CSFR.

Workaround is to have cors and csrf protection disabled. We have custom binary compiled from this [trezord branch](https://github.com/trezor/trezord-go/tree/cypress)

## Debug tests locally

See [docker readme](../../../../docker/README.md)

    