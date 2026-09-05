# @trezor/connect – Browser Web App Platform

## Package

```bash
npm install @trezor/connect-web
# or
yarn add @trezor/connect-web
```

Use `@trezor/connect-web` instead of `@trezor/connect` for browser apps. It handles popup
lifecycle and browser-specific transport selection automatically.

## Browser Support

| Environment             | WebUSB | Bridge |
| ----------------------- | ------ | ------ |
| Chrome / Edge (desktop) | ✓      | ✓      |
| Firefox (desktop)       | ✗      | ✓      |
| Safari                  | ✗      | ✗      |
| Chrome (Android)        | ✓      | ✗      |

WebUSB requires Chrome/Chromium. Firefox and other browsers need Trezor Bridge installed.

## Initialization

```typescript
import TrezorConnect from '@trezor/connect-web';

await TrezorConnect.init({
    manifest: {
        email: 'developer@example.com',
        appUrl: 'https://myapp.io',
        appName: 'My App',
    },
    // Default: tries BridgeTransport first, then WebUsbTransport
    // To prefer WebUSB:
    transports: ['WebUsbTransport', 'BridgeTransport'],
});
```

## How the Popup Works

When a method needs device interaction (PIN, passphrase, on-device confirmation):

1. A secure popup window opens at `https://suite.trezor.io/web/connect-popup/`
2. The user interacts with the device through the popup
3. The popup closes and the result is returned to your page

**You do NOT need to handle `UI_EVENT` manually** — the popup does it.

If Trezor Suite Desktop is running, it handles the UI instead of the popup.

## Bundler Configuration (webpack / Vite)

`@trezor/connect-web` uses Web Workers internally. Make sure your bundler can handle them.

### Webpack

```javascript
// webpack.config.js
module.exports = {
    // ...
    experiments: {
        asyncWebAssembly: true, // if using WASM features
    },
};
```

### Vite

```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@trezor/connect-web'],
    },
});
```

## WebUSB Permission Request

WebUSB requires a user gesture (button click) to show the device picker the first time:

```typescript
// This must be called from a click handler, not on page load
button.addEventListener('click', async () => {
    const result = await TrezorConnect.getAddress({
        path: "m/49'/0'/0'/0/0",
        coin: 'btc',
    });
    // The WebUSB permission dialog and/or popup appears automatically
});
```

## Transport Error Handling

```typescript
import { TRANSPORT_EVENT, TRANSPORT } from '@trezor/connect-web';

TrezorConnect.on(TRANSPORT_EVENT, event => {
    if (event.type === TRANSPORT.ERROR) {
        // Show prompt to install Bridge or switch to a WebUSB-compatible browser
        showBridgeInstallPrompt();
    }
});
```

## Content Security Policy

If your app uses CSP, allow the popup origin:

```
connect-src https://suite.trezor.io;
frame-src https://suite.trezor.io;
```
