# @trezor/connect – Integration Overview

## What is @trezor/connect?

@trezor/connect is the universal JavaScript/TypeScript SDK for integrating Trezor hardware wallets
into third-party applications. It handles device communication, UI prompts (PIN, passphrase, on-device
confirmation), and blockchain operations.

---

## Which package do I install?

| Environment                        | Package                        |
| ---------------------------------- | ------------------------------ |
| Node.js (backend / CLI / Electron) | `@trezor/connect`              |
| Browser web app                    | `@trezor/connect-web`          |
| Browser extension (Manifest V3)    | `@trezor/connect-webextension` |
| React Native                       | `@trezor/connect-mobile`       |

The correct transport is selected automatically via package.json field resolution
(`main`, `browser`, `react-native`). You do NOT need to manually pick a transport variant.

---

## Installation

```bash
npm install @trezor/connect
# or
yarn add @trezor/connect
```

---

## Initialization

Every app must call `TrezorConnect.init()` once before any other method.
The `manifest` field is **required**.

```typescript
import TrezorConnect from '@trezor/connect';

await TrezorConnect.init({
    manifest: {
        email: 'developer@example.com',
        appUrl: 'https://myapp.io',
        appName: 'My App',
    },
    // Optional settings:
    debug: false,
    transportReconnect: true, // keep retrying if Bridge is not running
    pendingTransportEvent: true, // fire TRANSPORT event even if device already connected
});
```

Errors thrown by init:

- `Init_ManifestMissing` – manifest not provided
- `Init_AlreadyInitialized` – call `dispose()` before re-initializing

Call `TrezorConnect.dispose()` to tear down the library (removes all listeners, resets state).

---

## The Response Pattern

**Every API method returns a Promise of a discriminated union.** Always check `result.success`.

```typescript
type Response<T> = Promise<
    | { success: true; payload: T; device?: DeviceIdentity }
    | { success: false; error: { message: string; code: string } }
>;
```

### Example

```typescript
const result = await TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
});

if (result.success) {
    console.log(result.payload.address);
    console.log(result.payload.path); // number[]
    console.log(result.payload.serializedPath); // "m/49'/0'/0'/0/0"
    console.log(result.device); // which device responded
} else {
    console.error(result.error.code); // e.g. 'Method_Cancel'
    console.error(result.error.message);
}
```

---

## Key Concepts

### CommonParams – targeting a specific device

All method params extend `CommonParams`:

```typescript
{
    device?: {
        path?: string;            // USB path, from DEVICE_EVENT
        state?: DeviceState;      // passphrase session state
        instance?: number;        // for multiple passphrases on same device
        useEmptyPassphrase?: boolean;
    };
    keepSession?: boolean;        // keep device session open after the call
    useCardanoDerivation?: boolean;
}
```

### Bundle calls

Many methods accept `{ bundle: Params[] }` to operate on multiple items in one device session
(single PIN/passphrase entry). Returns an array response.

```typescript
const result = await TrezorConnect.getAddress({
    bundle: [
        { path: "m/49'/0'/0'/0/0", coin: 'btc' },
        { path: "m/49'/0'/0'/0/1", coin: 'btc' },
    ],
});
// result.payload is Address[]
```

### keepSession

Set `keepSession: true` to batch multiple calls without re-prompting passphrase:

```typescript
await TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc', keepSession: true });
await TrezorConnect.getPublicKey({ path: "m/49'/0'/0'", coin: 'btc' }); // same session
```

### DerivationPath

Can be expressed as a string or number array:

```typescript
type DerivationPath = string | number[];

"m/44'/0'/0'"[(0x80000000 | 44, 0x80000000 | 0, 0x80000000 | 0)]; // string // number[]
```

---

## Transport Requirements

Trezor Bridge (trezord) must be running on the user's machine for most desktop/browser scenarios.
It runs at `http://127.0.0.1:21325`.

Alternative transports:

- **WebUSB** – direct USB in Chrome/Edge (no Bridge needed); add `'WebUsbTransport'` to `transports`
- **NodeUSB** – direct USB in Electron/Node; requires native USB access
- **UDP** – for emulator development

```typescript
await TrezorConnect.init({
    manifest: { ... },
    transports: ['BridgeTransport', 'WebUsbTransport'], // browser: try both
});
```

---

## Interactive Docs & Examples

- Connect Explorer (live API reference): https://connect.trezor.io/
- Code examples: `packages/connect-examples/` in the monorepo
