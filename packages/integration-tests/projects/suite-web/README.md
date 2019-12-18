# Suite Web tests

Suite uses [Cypress](https://docs.cypress.io/guides/overview/why-cypress.html) to run e2e tests.

## Bridge

Cypress does not send request origin headers correctly, so tests must be run againts custom binary of bridge in tests folder which has respective checks disabled.

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
