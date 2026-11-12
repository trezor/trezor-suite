# @trezor/protobuf

Library for handling protobuf interfaces with Trezor, powered by [`@bufbuild/protobuf`](https://www.npmjs.com/package/@bufbuild/protobuf).

## From Protobuf to TypeScript

This section describes how the definitions of protobuf messages maintained in the
firmware repository are semi-automatically translated to TypeScript definitions that are used in the `@trezor/connect` codebase and by its users, respectively.

### The short version

To use new features of trezor-firmware, you need to update the protobuf definitions.

1. Run `yarn update-protobuf <branch-name>` to generate new `./src/definitions/*_dict.ts` (`ProtobufDict`) and the corresponding TypeBox schemas (`./src/definitions/*.ts`). If you don't provide the `<branch-name>` argument, `main` will be used.

### In depth explanation

The source of truth is the `.proto` definitions in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/main/common/protob).

The `.proto` definitions are processed by `buf generate` using the local plugin `scripts/protoc-gen-plugin.ts`, built on `@bufbuild/protobuf`. For each `.proto` file, the plugin generates:

- `*_dict.ts`: a serializable `ProtobufDict` (encoded file descriptor, dependencies, message and enum descriptors, and message type IDs), which `ProtobufManager` loads for encoding and decoding.
- `*.ts`: TypeBox schemas and TypeScript types of the messages and enums, re-exported by `index.ts`.

The plugin also applies the 'patches' from `scripts/protobuf-patches/`. The patches compensate for/fix:

- The source `.proto` definitions that do not reflect the actual business logic, usually fields marked as required that are in fact optional.
- Fields typed as `uint32`, `uint64`, `sint32` and `sint64` in protobuf that need to be represented as strings at runtime because of the insufficient range of JavaScript numbers. Runtime conversion is handled automatically by `@trezor/transport`.
- Similarly, fields typed as `bytes` in protobuf may be represented at runtime as a hexadecimal `string`, `Buffer`, `Uint8Array` or `Array<number>`.
- Optional protobuf fields that are typed as `<T> | undefined` but are in fact deserialized as `<T> | null`. This could be handled globally by `@trezor/transport`. The patches exist mainly for historical reasons.

Protobuf updates are done automatically via the [GitHub workflow](../../.github/workflows/update-protobuf.yml).
