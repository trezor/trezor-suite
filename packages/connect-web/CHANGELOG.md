See https://github.com/trezor/trezor-suite/blob/develop/packages/connect/CHANGELOG.md for the Connect changelog. This file lists only changes to the `@trezor/connect-web` package itself.

# 10.0.0

The Connect core is no longer bundled in this package. `@trezor/connect-web` connects your page to the core hosted by Trezor Suite, over a local WebSocket when Suite desktop is running and through the Suite web popup otherwise. Setup is described at https://connect.trezor.io/10/#web.

- The `popup` and `iframe` values of `coreMode` and the `connect-iframe` build were removed (a902e2d3cb, 372d11f819).
- The `connectSrc` and `popup` settings were removed. The Suite popup URL is derived automatically (09187966be, 1f5d7a30a2).
- The WebUSB helpers `renderWebUSBButton`, `requestWebUSBDevice` and `disableWebUSB` were removed. Suite owns the device transport (81636218f6, b2aa45e5d6).
- When the browser blocks the local connection to Suite desktop, the call fails with a `local-network-access` error instead of a generic one (f0726ae443).
- ESM only. The build output moved to `lib/` as `.js` and `.d.ts` files, and the license changed to MIT (b99609bfb8, 25f0ed758f, 7b03152f66).
