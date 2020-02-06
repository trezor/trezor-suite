# Suite Web tests

Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Bridge

Cypress has 2 troubles when communicating with trezord. 

1. Does not send request origin headers correctly -> problem with CORS.
1. Tests in CI fail occasionally on POST to '/' with 403 -> problem with CSFR.

Workaround is to have cors and csrf protection disabled. We have custom binary compiled from this [trezord branch](https://github.com/trezor/trezord-go/tree/cypress)


## Emulator

Emulator binary is present in tests folder. Currently tests run with 2.1.4.

## Debug tests locally

Run dev server first
`yarn workspace @trezor/suite-web dev`

Then spin up Cypress using this command

`yarn workspace @trezor/suite-web test:integration:local:open`

Note that running tests againts local web server needs to change default timeouts in Cypress. This is because of the on-demand compilation used in next.js. 

## Running tests locally

`yarn workspace @trezor/suite-web test:integration:local:run`
