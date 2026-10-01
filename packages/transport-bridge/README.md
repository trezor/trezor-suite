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

## HTTP API: `protocol` values

`POST /call/:session`, `POST /post/:session` and `POST /read/:session` take a JSON envelope whose
`protocol` field selects the wire codec. Accepted values:

| value    | description                                                        |
| -------- | ------------------------------------------------------------------ |
| `v1`     | Trezor wire protocol v1 — payload prefixed with the magic `3f2323` |
| `v2`     | Trezor wire protocol v2 (THP)                                      |
| `bridge` | **Deprecated** — trezord-go's headers-only framing                 |

Any other value is rejected with HTTP 400 and
`{"error":"unexpected error","message":"Invalid BridgeProtocolMessage protocol"}`.

### `bridge` is deprecated

`bridge` exists only for the legacy trezord-go HTTP format and is not emitted by any Trezor client.
Responses to requests using it carry a `Deprecation` header and a `Link` header pointing at
[#23794](https://github.com/trezor/trezor-suite/issues/23794), both listed in
`Access-Control-Expose-Headers` so browser pages can read them; behaviour is otherwise unchanged.
The headers are scoped to the `bridge` value rather than to the `/call`, `/post` and `/read` paths:
`v1` and `v2` requests to those paths get none of them. `bridge` will be removed, with no date
committed to — no `Sunset` header is sent.

To migrate, send `protocol: 'v1'`, prepend the v1 magic `3f2323` to `data` and strip it from the
`data` returned by `/call` and `/read`.
