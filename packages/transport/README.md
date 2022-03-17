# @trezor/transport

[![NPM](https://img.shields.io/npm/v/@trezor/transport.svg)](https://www.npmjs.org/package/@trezor/transport)

Library for low-level communication with Trezor.

Intended as a "building block" for other packages - it is used in ~~trezor.js~~ (deprecated) and trezor-connect.

_You probably don't want to use this package directly._ For communication with Trezor with a more high-level API, use [trezor-connect](https://github.com/trezor/connect).

## What is the purpose

-   translate JSON payloads to binary messages using [protobuf definitions](https://github.com/trezor/trezor-common/tree/master/protob) comprehensible to Trezor devices
-   chunking and reading chunked messages according to the [Trezor protocol](https://github.com/trezor/trezor-common/blob/master/protob/protocol.md)
-   exposing single API for various transport methods:
    -   Trezor Bridge
    -   Webusb
-   Create and expose typescript definitions based on protobuf definitions.

## Updating messages

In order to be used new features of trezor-firmware you need to update protobuf definitions.

1. `git submodule update --init --recursive` to initialize trezor-common submodule
1. `yarn workspace @trezor/transport update:submodules` to update trezor-common submodule
1. `yarn workspace @trezor/transport update:protobuf` to generate new `messages.json` and `protobuf.d.ts`

### Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
