# @trezor/connect-webextension

[![NPM](https://img.shields.io/npm/v/@trezor/connect-webextension.svg)](https://www.npmjs.org/package/@trezor/connect-webextension)

The `@trezor/connect-webextension` package provides an implementation of `@trezor/connect` designed specifically for MV3 web extensions. Key features include:

- Compatibility with service worker environments.
- Full access to the TrezorConnect API.
- Popup-based user interaction through Suite Web.
- Response delivery back to the calling service worker.

## Architecture

This package exclusively uses the `externally_connectable` API. It does **not** inject `connect-script`, does **not** use inline iframes as in the previous @trezor/connect versions.

The flow is:

1. The service worker checks for suite-desktop app. If running, it opens a websocket connection to it. If not, it opens Suite Web in a browser.
2. The user handles their request inside the dedicated Trezor UI
3. Response is returned to your application

## Setup

### 1) manifest.json

Allow Suite Web origins to message your extension using `externally_connectable`. Without this, the Suite Web flow would not be available.

```json
"externally_connectable": {
  "matches": [
    "https://suite.trezor.io/*"
  ]
}
```

### 2) Service worker

Import the library in your service worker (MV3 background):

```javascript
import TrezorConnect from '@trezor/connect-webextension';
```

The library is available in the service worker context. If you need to call it from your extension UI, communicate with the service worker using your own messaging layer.

Note: the service worker may be suspended when idle, so you should wake it up before invoking `TrezorConnect`.
