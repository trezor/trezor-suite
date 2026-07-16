# 1.0.0-alpha.1

Part of the Connect 10 ecosystem release.

`@trezor/transport-common` hosts the environment-agnostic transport layer: the abstract transport base classes, THP, sessions, the structural USB interface, shared utils, and `BridgeTransport`. `BridgeTransport` moved here from `@trezor/transport` so that browser and React Native consumers can use it without pulling in Node-only modules (`usb` / `dgram`).

Breaking changes:

- `BridgeTransport` `DEFAULT_PORT` changed from `21325` to `21328`. The legacy standalone `trezord-go` Bridge (port 21325) is no longer supported. Consumers running on a setup with the old standalone Bridge must migrate to the node-bridge bundled with Suite Desktop.
- Removed `isOutdated` flag on `AbstractTransport` / `BridgeTransport`. Detection of the legacy Bridge is now done outside of the transport layer.
- Removed internal `useProtocolMessages` fallback; `BridgeTransport` always uses the modern message protocols (`bridge` / `v1` / `v2`).
