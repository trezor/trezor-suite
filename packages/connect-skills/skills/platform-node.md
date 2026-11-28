# @trezor/connect – Node.js Platform

## Package

```bash
npm install @trezor/connect
# or
yarn add @trezor/connect
```

## Prerequisites

- **Trezor Bridge** must be running on the user's machine (download from https://suite.trezor.io/web/bridge/)
- Bridge listens at `http://127.0.0.1:21325`
- Device connected via USB

Alternatively, use `NodeUsbTransport` for direct USB access without Bridge (requires `@trezor/transport` native bindings and elevated permissions on Linux).

## Initialization

```typescript
import TrezorConnect, { DEVICE_EVENT, TRANSPORT_EVENT } from '@trezor/connect';

await TrezorConnect.init({
    manifest: {
        email: 'developer@example.com',
        appUrl: 'https://myapp.io',
        appName: 'My App',
    },
    // BridgeTransport is the default in Node.js
    // transportReconnect: true,  // keep retrying if Bridge not running yet
});

TrezorConnect.on(TRANSPORT_EVENT, event => {
    console.log('Transport event:', event.type, event.payload);
});

TrezorConnect.on(DEVICE_EVENT, event => {
    console.log('Device event:', event.type, event.payload);
});
```

## UI Interaction in Node.js

The browser popup is NOT available in Node.js. You must handle PIN and passphrase prompts manually via `UI_EVENT`:

```typescript
import { UI_EVENT, UI } from '@trezor/connect';
import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>(resolve => rl.question(q, resolve));

TrezorConnect.on(UI_EVENT, async event => {
    if (event.type === UI.REQUEST_PIN) {
        const pin = await ask('Enter PIN (use number positions): ');
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
    }

    if (event.type === UI.REQUEST_PASSPHRASE) {
        const passphrase = await ask('Enter passphrase (or press Enter for none): ');
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: { value: passphrase, passphraseOnDevice: false, save: false },
        });
    }

    if (event.type === UI.REQUEST_BUTTON) {
        console.log('Please confirm the action on your Trezor device...');
    }
});
```

## Direct USB (no Bridge)

```typescript
import TrezorConnect from '@trezor/connect';

await TrezorConnect.init({
    manifest: { email: 'dev@example.com', appUrl: 'myapp', appName: 'My App' },
    transports: ['NodeUsbTransport'],
});
```

On Linux, USB access requires udev rules. See https://trezor.io/learn/a/udev-rules.

## Emulator / Testing

For development without hardware, use [trezor-user-env](https://github.com/trezor/trezor-user-env):

```typescript
await TrezorConnect.init({
    manifest: { email: 'dev@test.com', appUrl: 'localhost', appName: 'Test' },
    transports: [{ type: 'UdpTransport', port: 21324 }],
});
```

## Teardown

```typescript
process.on('SIGINT', async () => {
    await TrezorConnect.dispose();
    process.exit(0);
});
```
