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

## From Protobuf to TypeScript and Flow

This section describes how the definitions of protobuf messages maintained in the
firmware repo are semi-automatically translated to Flow and TypeScript definitions that are used in Connect codebase and by Connect users respectively.

### The short version

In order to be able to use new features of trezor-firmware you need to update protobuf definitions.

1. `git submodule update --init --recursive` to initialize trezor-common submodule
1. `yarn workspace @trezor/transport update:submodules` to update trezor-common submodule
1. `yarn workspace @trezor/transport update:protobuf` to generate new `messages.json` and `protobuf.d.ts`

### In depth explanation

The beginning and source of truth are the `.proto` definitions in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/master/common/protob). These are duplicated as read-only in the [trezor-common](https://github.com/trezor/trezor-common) repository.

`trezor-common` is included in `trezor-suite` as a git submodule mounted at `packages/transport/trezor-common`.`

Here, `.proto` definitions are translated to a JSON format using [pbjs](https://www.npmjs.com/package/pbjs) package. This JSON is used on runtime by the `@trezor/transport` package
for (de)serialization logic and to generate the Flow and Typescript definitions.

The JSON is transformed to Flow and/or TypeScript definitions by a script in `scripts/protobuf-types.js`. The script also applies 'patches' I.e. after-the-fact fixes manually described in `scripts/protobuf-patches.js`. The patches compensate for/fix

-   The source `.proto` definitions that do not reflect the actual business logic. Usually fields marked as required which are in fact optional.
-   Fields typed as `uint32`, `uint64`, `sint32`, `sint64` in protobuf that need to be represented as strings in runtime because of javascript number's insufficient range. Runtime conversion is handled automatically by `@trezor/transport`.
-   Similarly, fields typed as `bytes` in protobuf may be represented as hexadecimal `string`, `Buffer`, `Uint8Array` or `Array<number>` in runtime.
-   Optional protobuf fields that get typed as `<T> | undefined` but are in fact deserialized as `<T> | null`. This could be handled globally by `@trezor/transport`. The patches exist mainly for historical reasons.

All these steps are done manually and all the generated files are tracked in git. It's also not uncommon to circumvent
some step by eg. generating the messages.json file not from the Common submodule but directly from the firmware repo.

## Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
