# Trezor javascript SDK

Most of Trezor Connect documentation has been moved to [Connect Explorer](https://connect.trezor.io/).

This page contains some remaining documentation useful for developers or internal purposes.

## Package layout

The SDK is split between an execution engine and environment-facing packages:

- `@trezor/connect-core` holds the shared implementation — methods, device and session management,
  backend integration, firmware and coin data. It selects no transports; a host injects them.
- `@trezor/connect` is the node.js entry point. It runs the engine in-process and supplies the node
  transports (Trezor Bridge, then direct USB).
- `@trezor/connect-web`, `@trezor/connect-webextension` and `@trezor/connect-mobile` are thin
  clients that delegate execution to a Trezor Suite host.
- `@trezor/connect-common` holds the contracts all of them share: types, events, constants and the
  API factories.

Application developers pick the environment-facing package for their platform. `@trezor/connect-core`
is published only so that those packages and the Suite applications can depend on it.
