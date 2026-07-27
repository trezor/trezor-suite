# Trezor Connect – Web Extension Example (MV3)

A minimal Chrome extension (Manifest V3) showing how to integrate `@trezor/connect-webextension` using a service worker and a managed tab.

## Build

From the monorepo root, install dependencies first if you haven't already:

```sh
yarn
```

Then build the extension:

```sh
yarn workspace @trezor/webextension-mv3-sw-ts build
```

The output is written to `packages/connect-examples/webextension/build/`.

### Build against a local Suite instance

By default the extension connects to the production Trezor Suite. To point it at a locally running Suite (e.g. `http://localhost:8000`) pass the `SUITE_WEB_URL` environment variable:

```sh
SUITE_WEB_URL=http://localhost:8000 yarn workspace @trezor/webextension-mv3-sw-ts build
```

Start Suite locally in a separate terminal before using the extension:

```sh
yarn suite:dev   # serves Suite at http://localhost:8000
```

## Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `build/` folder.
4. Click the extension icon in the toolbar to open the popup, then press **Connect manager** to open the manager tab.
