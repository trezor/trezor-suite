# @trezor/connect-core

[![NPM](https://img.shields.io/npm/v/@trezor/connect-core.svg)](https://www.npmjs.org/package/@trezor/connect-core)

The in-process execution engine behind Trezor Connect: methods, device and session management,
backend integration and the firmware/coin data utilities.

**This is not the package to integrate against.** Application developers should use an
environment-facing package, which sets up transports and host communication for them:

- node.js: [@trezor/connect](https://www.npmjs.com/package/@trezor/connect)
- web: [@trezor/connect-web](https://www.npmjs.com/package/@trezor/connect-web)
- browser extension: [@trezor/connect-webextension](https://www.npmjs.com/package/@trezor/connect-webextension)
- React Native: [@trezor/connect-mobile](https://www.npmjs.com/package/@trezor/connect-mobile)

It is published so that composition roots — the packages above and the Trezor Suite applications —
can depend on it. It selects no transports of its own: a host injects them through
`init({ transports })`, and an empty list stays empty. Its API surface is not covered by the
compatibility promises of the environment-facing packages.

## Docs

Interactive API explorer is available on https://connect.trezor.io/

## Tests

For integration testing against trezord and emulator refer to [this document](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-core/e2e/README.md).
