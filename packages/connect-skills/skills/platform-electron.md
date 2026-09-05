# @trezor/connect – Electron Platform

## Package

```bash
npm install @trezor/connect
# or
yarn add @trezor/connect
```

Use `@trezor/connect` (the Node.js variant) in the **main process**. Do NOT use `@trezor/connect-web`
in the main process — it targets browser environments.

## Recommended Architecture: Main Process

Run TrezorConnect in the Electron main process and expose it to the renderer via IPC.
This avoids WebUSB permission issues and gives access to NodeUSB.

### Main Process

```typescript
// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import TrezorConnect from '@trezor/connect';

app.whenReady().then(async () => {
    await TrezorConnect.init({
        manifest: {
            email: 'developer@example.com',
            appUrl: 'https://myapp.io',
            appName: 'My Electron App',
        },
        transports: ['NodeUsbTransport', 'BridgeTransport'],
    });

    // Relay calls from renderer
    ipcMain.handle('trezor:call', async (_event, method, params) => {
        return TrezorConnect[method](params);
    });

    // Forward events to renderer
    const win = new BrowserWindow({ ... });

    TrezorConnect.on('DEVICE_EVENT', event => {
        win.webContents.send('trezor:device-event', event);
    });
});
```

### Preload Script

```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('trezor', {
    call: (method: string, params: object) => ipcRenderer.invoke('trezor:call', method, params),
    onDeviceEvent: (cb: (event: unknown) => void) =>
        ipcRenderer.on('trezor:device-event', (_e, event) => cb(event)),
});
```

### Renderer Process

```typescript
// renderer.ts
const result = await window.trezor.call('getAddress', {
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
});
```

## Transport Options

| Transport          | Notes                                                       |
| ------------------ | ----------------------------------------------------------- |
| `NodeUsbTransport` | Direct USB, no Bridge needed. Requires udev rules on Linux. |
| `BridgeTransport`  | Requires Trezor Bridge running. More stable cross-platform. |

```typescript
// Prefer NodeUSB, fall back to Bridge
transports: ['NodeUsbTransport', 'BridgeTransport'],
```

## UI Interaction

In the main process there is no popup. Handle PIN/passphrase via `UI_EVENT` by sending
prompts to the renderer window:

```typescript
import { UI_EVENT, UI } from '@trezor/connect';

TrezorConnect.on(UI_EVENT, async event => {
    if (event.type === UI.REQUEST_PIN) {
        // Send prompt to renderer, wait for response
        const pin = await new Promise<string>(resolve => {
            win.webContents.send('trezor:request-pin');
            ipcMain.once('trezor:pin-response', (_e, value) => resolve(value));
        });
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
    }

    if (event.type === UI.REQUEST_BUTTON) {
        win.webContents.send('trezor:request-button');
    }
});
```

## Example

A working example is available at `packages/connect-examples/electron-main-process/` in the monorepo.
