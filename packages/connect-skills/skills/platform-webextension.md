# @trezor/connect – Browser Extension Platform (MV3)

## Package

```bash
npm install @trezor/connect-webextension
# or
yarn add @trezor/connect-webextension
```

Use `@trezor/connect-webextension` for Manifest V3 browser extensions. It is designed
for service worker environments and uses `externally_connectable` messaging (not iframes or
injected scripts).

## Architecture

1. Your service worker calls a TrezorConnect method
2. The library opens Suite Web (or connects to Suite Desktop via WebSocket)
3. User completes the interaction inside the dedicated Trezor UI
4. Response is delivered back to your service worker

## manifest.json Setup

Allow Suite Web to message your extension via `externally_connectable`:

```json
{
    "manifest_version": 3,
    "externally_connectable": {
        "matches": ["https://suite.trezor.io/*"]
    },
    "permissions": ["storage"]
}
```

## Service Worker (background.js)

Import and use TrezorConnect in the service worker:

```typescript
// background.ts (service worker)
import TrezorConnect from '@trezor/connect-webextension';

await TrezorConnect.init({
    manifest: {
        email: 'developer@example.com',
        appUrl: 'https://mychrome.extension',
        appName: 'My Extension',
    },
});

const result = await TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
});
```

## Calling from Extension UI (popup/content)

Service workers can be suspended when idle. Wake the service worker and relay the call:

```typescript
// popup.ts or content-script.ts
async function callTrezor(method: string, params: object) {
    // Wake up the service worker first
    await chrome.runtime.sendMessage({ type: 'PING' });

    return chrome.runtime.sendMessage({ type: 'TREZOR_CALL', method, params });
}

// background.ts — relay to TrezorConnect
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'TREZOR_CALL') {
        TrezorConnect[message.method](message.params).then(sendResponse);
        return true; // keep channel open for async response
    }
});
```

## Important Constraints

- **Service workers have no persistent state** — re-initialize TrezorConnect if the worker restarts
- **No DOM access** in service workers — `@trezor/connect-webextension` handles this
- **UI is handled by Suite Web** — you cannot render PIN/passphrase UI yourself
- The library does NOT inject `connect-script` or use inline iframes (unlike older versions)

## Detecting Suite Desktop

The library automatically checks for a running Suite Desktop WebSocket before opening Suite Web.
No extra configuration needed.
