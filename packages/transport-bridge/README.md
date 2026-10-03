# @trezor/transport-bridge

- javascript clone of https://github.com/trezor/trezord-go

## Build and run using node

- `yarn workspace @trezor/transport-bridge build:js`
- `node ./packages/transport-bridge/dist/bin.js`

Javascript build has 2 phases - node, using esbuild, and web, using webpack. It still can be used without the `build:lib` script. But to have
also bridge status page available you need to build.

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
[#23794](https://github.com/trezor/trezor-suite/issues/23794); behaviour is otherwise unchanged. It
will be removed, with no date committed to — no `Sunset` header is sent.

To migrate, prepend the v1 magic `3f2323` to the payload and send `protocol: 'v1'` instead.
