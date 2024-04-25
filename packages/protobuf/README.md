# @trezor/protobuf

Library for handling protobuf interfaces with Treozr

## From Protobuf to TypeScript

This section describes how the definitions of protobuf messages maintained in the
firmware repo are semi-automatically translated to TypeScript definitions that are used in Connect codebase and by Connect users respectively.

### The short version

In order to be able to use new features of trezor-firmware you need to update protobuf definitions.

1. `yarn update-protobuf <branch-name>` to generate new `./messages.json` and `./src/types/messages.ts`. If you don't provide branch-name argument, 'main' will be used.

### In depth explanation

The beginning and source of truth are the `.proto` definitions in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/main/common/protob).

Here, `.proto` definitions are translated to a JSON format using [pbjs](https://www.npmjs.com/package/pbjs) package. This JSON is used on runtime by the `@trezor/transport` package
for (de)serialization logic and to generate Typescript definitions.

The JSON is transformed to TypeScript definitions by a script in `scripts/protobuf-types.js`. The script also applies 'patches' I.e. after-the-fact fixes manually described in `scripts/protobuf-patches.js`. The patches compensate for/fix

-   The source `.proto` definitions that do not reflect the actual business logic. Usually fields marked as required which are in fact optional.
-   Fields typed as `uint32`, `uint64`, `sint32`, `sint64` in protobuf that need to be represented as strings in runtime because of javascript number's insufficient range. Runtime conversion is handled automatically by `@trezor/transport`.
-   Similarly, fields typed as `bytes` in protobuf may be represented as hexadecimal `string`, `Buffer`, `Uint8Array` or `Array<number>` in runtime.
-   Optional protobuf fields that get typed as `<T> | undefined` but are in fact deserialized as `<T> | null`. This could be handled globally by `@trezor/transport`. The patches exist mainly for historical reasons.

All these steps are done manually and all the generated files are tracked in git. It's also not uncommon to circumvent
some step by e.g. generating the messages.json file not from the Common submodule but directly from the firmware repo.

## Publishing

This package is published to npm registry because it is a dependency of [@trezor/connect](https://github.com/trezor/trezor-suite/issues/5440) which can be installed as a standalone package.

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
