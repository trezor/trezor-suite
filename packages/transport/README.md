# @trezor/transport

[![NPM](https://img.shields.io/npm/v/@trezor/transport.svg)](https://www.npmjs.org/package/@trezor/transport)

Library for low-level communication with Trezor.

Intended as a "building block" for other packages - it is used in ~~trezor.js~~ (deprecated) and [@trezor/connect](https://github.com/trezor/trezor-suite/tree/develop/packages/connect).

_You probably don't want to use this package directly._ For communication with Trezor via a more high-level API, use [@trezor/connect](https://github.com/trezor/trezor-suite/tree/develop/packages/connect).

## What is the purpose

-   translate JSON payloads to binary messages using [protobuf definitions](https://github.com/trezor/trezor-common/tree/master/protob) comprehensible to Trezor devices
-   chunking and reading chunked messages according to the [Trezor protocol](https://github.com/trezor/trezor-common/blob/master/protob/protocol.md)
-   exposing single API for various transport methods:
    -   Trezor Bridge
    -   WebUSB

## Publishing

This package is published to npm registry because it is a dependency of [@trezor/connect](https://github.com/trezor/trezor-suite/issues/5440) which can be installed as a standalone package.

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
