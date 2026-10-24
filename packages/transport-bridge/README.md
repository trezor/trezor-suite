# @trezor/transport-bridge

- javascript clone of https://github.com/trezor/trezord-go

## Build and run using node

- `yarn workspace @trezor/transport-bridge build:js`
- `node ./packages/transport-bridge/dist/bin.js`

Javascript build has 2 phases - node, using esbuild, and web, using webpack. It still can be used without the `build:lib` script. But to have
also bridge status page available you need to build.

## HID-only Trezor One devices

Trezor One with firmware 1.6.3 and older exposes only a HID interface (`534c:0001`). libusb cannot claim it on macOS and Windows; on Linux it can, which is how the usb apis serve such a device there today. Passing `hid: { origins }` to `TrezordNode` routes these devices through a `node-hid` backend on every platform:

- The backend is loaded by the first request coming from one of `origins`. Until then nothing changes.
- Only requests with an `Origin` header exactly equal to one of `origins` can acquire such a device and use its session. Everyone else gets `Unable to open device` on `/acquire` and `session not found` on `/call`, `/read`, `/post`, `/release` and `/abort`, although they still see the device in `/enumerate` and `/listen`.
- The general origin allowlist matches by hostname suffix. That is too broad here, because these devices keep the PIN and the passphrase unlocked for whoever acquires them next.
- For the same reason the usb apis are not allowed to open such a device once the setting is on, so on Linux every other origin deliberately loses the access it has without it.
- When the `node-hid` backend cannot be loaded, such a device stays listed but openable by nobody.

For development run `node ./packages/transport-bridge/dist/bin.js --hid-origin=http://localhost:5181`.
