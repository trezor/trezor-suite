See https://github.com/trezor/trezor-suite/blob/develop/packages/connect/CHANGELOG.md for the Connect changelog. This file lists only changes to the `@trezor/connect-webextension` package itself.

# 10.0.0

The Connect core is no longer bundled in this package. The extension's service worker talks to the core hosted by Trezor Suite through the same popup and desktop WebSocket code as `@trezor/connect-web`. Setup is described at https://connect.trezor.io/10/#web-extension.

- The Suite popup reaches the extension through `externally_connectable` instead of an injected content script, so the extension manifest must allow the Suite origin (c84e94b607).
- The `popup` value of `coreMode` was removed (a902e2d3cb).
- The `popup` and `_extendWebextensionLifetime` settings were removed (1f5d7a30a2, e33578fe8f).
- ESM only. The build output moved to `lib/` as `.js` and `.d.ts` files, and the license changed to MIT (b99609bfb8, 25f0ed758f, 7b03152f66).
