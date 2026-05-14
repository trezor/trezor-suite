# Connect CLI

Nodejs client for `@trezor/connect`

Run `yarn workspace @trezor/connect-cli cli --help`

[HELP](./src/args.ts)

### Bridge transport

**requires** `transport-bridge` process.

Run

```
tsx ./packages/transport-bridge/src/bin.js
```

### Bluetooth bluetooth

**requires** already paired bluetooth device.

**requires** `transport-bluetooth` binary.

Run

```
./packages/suite-data/files/bin/bluetooth/[your-arch]/trezor-bluetooth
```
