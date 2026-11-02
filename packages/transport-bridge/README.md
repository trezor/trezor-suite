# @trezor/transport-bridge

- javascript clone of https://github.com/trezor/trezord-go

## Build and run using node

- `yarn workspace @trezor/transport-bridge build:js`
- `node ./packages/transport-bridge/dist/bin.js`

Javascript build has 2 phases - node, using esbuild, and web, using webpack. It still can be used without the `build:lib` script. But to have
also bridge status page available you need to build.

## HID-only Trezor One devices

Trezor One with firmware 1.6.3 and older has only a HID interface (`534c:0001`), which libusb cannot claim on macOS and Windows. The `hid` api serves these devices, and no others, through `node-hid`. Run it as a separate `TrezordNode` next to the usb one, on its own port and open only to the pages that need it:

```ts
new TrezordNode({
    api: 'hid',
    port: 21329,
    allowedOrigins: ['trezor.io'],
    logger,
});
```

With `allowedOrigins` only pages on the listed hostnames and their subdomains can use the bridge, a request without an `Origin` header is refused too. `node-hid` is loaded by the first enumeration, so only those pages can make the bridge load it. Suite desktop starts such a bridge when a page opens `trezorsuite://hid-bridge`.

For development run `node ./packages/transport-bridge/dist/bin.js hid --port=21329 --origin=localhost`.
