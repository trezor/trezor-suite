See https://github.com/trezor/trezor-suite/blob/develop/packages/connect/CHANGELOG.md for the Connect changelog. This file lists only changes to the `@trezor/connect-mobile` package itself.

# 10.0.0

`@trezor/connect-mobile` opens the Trezor Suite Lite app through a deep link and receives the result on your callback URL, as it did in Connect 9. Setup is described at https://connect.trezor.io/10/#mobile.

- `init()` requires `deeplinkOpen` and `deeplinkCallbackUrl`. The `deeplinkUrl` and `coreMode` settings were removed (45403367bb).
- `manifest.appName` and `manifest.appIcon` are passed in the deep link so Suite Lite can show them in the approval prompt (7f962991a3).
- ESM only. The build output moved to `lib/` as `.js` and `.d.ts` files, and the license changed to MIT (b99609bfb8, 25f0ed758f, 7b03152f66).
