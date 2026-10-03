# @trezor/transport-bridge

- javascript clone of https://github.com/trezor/trezord-go

## Build and run using node

- `yarn workspace @trezor/transport-bridge build:js`
- `node ./packages/transport-bridge/dist/bin.js`

Javascript build has 2 phases - node, using esbuild, and web, using webpack. It still can be used without the `build:lib` script. But to have
also bridge status page available you need to build.

## HID-only Trezor One devices

Trezor One with firmware 1.6.3 and older exposes only a HID interface (`534c:0001`), which the usb apis cannot open. Passing `hid: { origins }` to `TrezordNode` adds a `node-hid` backend for these devices:

- The backend is loaded by the first request coming from one of `origins`. Until then nothing changes.
- Only requests with an `Origin` header exactly equal to one of `origins` can acquire such a device and use its session. Everyone else gets `Unable to open device` on `/acquire` and `session not found` on `/call`, `/read`, `/post`, `/release` and `/abort`, although they still see the device in `/enumerate` and `/listen`.
- The general origin allowlist matches by hostname suffix. That is too broad here, because these devices keep the PIN and the passphrase unlocked for whoever acquires them next.

For development run `node ./packages/transport-bridge/dist/bin.js --hid-origin=http://localhost:5181`.
