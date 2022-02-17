# @trezor/transport

Library for low-level communication with Trezor.

Intended as a "building block" for other packages - it is used in ~~trezor.js~~ (deprecated) and trezor-connect.

_You probably don't want to use this package directly._ For communication with Trezor with a more high-level API, use [trezor-connect](https://github.com/trezor/connect).

## What is the purpose

-   translate JSON payloads to binary messages using [protobuf definitions](https://github.com/trezor/trezor-common/tree/master/protob) comprehensible to Trezor devices
-   chunking and reading chunked messages according to the [Trezor protocol](https://github.com/trezor/trezor-common/blob/master/protob/protocol.md)
-   exposing single API for various transport methods:
    -   Trezor Bridge
    -   Webusb

### Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
