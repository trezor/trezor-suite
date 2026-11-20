# @trezor/connect – TypeScript Usage

## Importing Types

All public types are exported from the package root:

```typescript
import TrezorConnect, {
    // Event constants
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI_EVENT,

    // Event sub-type constants
    DEVICE,
    TRANSPORT,
    BLOCKCHAIN,
    UI,

    // Type imports
    type ConnectSettingsPublic,
    type Manifest,
    type TrezorDevice,
    type DeviceIdentity,
    type Features,

    // Response types
    type Address,
    type PublicKey,
    type AccountInfo,
} from '@trezor/connect';
```

## Response Type Helpers

The response discriminated union works cleanly with TypeScript narrowing:

```typescript
import TrezorConnect, { type Address } from '@trezor/connect';

const result = await TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc' });

if (result.success) {
    // result.payload is inferred as Address
    const { address, serializedPath }: Address = result.payload;
}
// result.error is only accessible when success === false
```

## Method Overloads: Single vs Bundle

Methods with bundle support have overloaded signatures:

```typescript
// Single call — payload is T
const single = await TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc' });
// single.payload is Address

// Bundle call — payload is T[]
const bundle = await TrezorConnect.getAddress({
    bundle: [
        { path: "m/49'/0'/0'/0/0", coin: 'btc' },
        { path: "m/49'/0'/0'/0/1", coin: 'btc' },
    ],
});
// bundle.payload is Address[]
```

## Device Event Narrowing

```typescript
import { DEVICE_EVENT, DEVICE, type TrezorDevice } from '@trezor/connect';

TrezorConnect.on(DEVICE_EVENT, event => {
    const device: TrezorDevice = event.payload;

    if (device.type === 'acquired') {
        // TypeScript knows device.features is available here
        const { model, major_version, minor_version } = device.features;
        const caps = device.unavailableCapabilities; // Record<string, string>
    }
});
```

## ConnectSettingsPublic

Full type for `init()` options:

```typescript
interface ConnectSettingsPublic {
    manifest?: {
        appName: string;
        appUrl: string;
        email: string;
        appIcon?: string;
    };
    debug?: boolean;
    transportReconnect?: boolean;
    transports?: Array<
        | 'BridgeTransport'
        | 'WebUsbTransport'
        | 'NodeUsbTransport'
        | 'UdpTransport'
        | Transport
        | (new (...args: any[]) => Transport)
    >;
    pendingTransportEvent?: boolean;
    binFilesBaseUrl?: string;
    enableFirmwareHashCheck?: boolean;
}
```

## UI Response Types

```typescript
import { UI } from '@trezor/connect';

// PIN response
TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: '1234' });

// Passphrase response
TrezorConnect.uiResponse({
    type: UI.RECEIVE_PASSPHRASE,
    payload: {
        value: 'my passphrase',
        passphraseOnDevice: false, // true = enter on device screen
        save: true, // cache for this session
    },
});

// Word response (recovery)
TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: 'abandon' });
```

## Strict Null Checks

`result.payload` is only accessible after narrowing on `result.success`. TypeScript enforces this:

```typescript
const result = await TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc' });

// ❌ TypeScript error — payload may not exist
console.log(result.payload.address);

// ✓ Correct
if (result.success) {
    console.log(result.payload.address); // Address
}
```

## Coin Shortcut Type

Coin identifiers are typed as `string` but follow a convention:

```typescript
// Bitcoin family: 'btc', 'ltc', 'bch', 'doge', 'dash', etc.
// Ethereum: 'eth', 'polygon', 'bnb', 'arb', etc.
// Others: 'xrp', 'ada', 'sol', 'xlm', 'xtz', 'trx', 'xmr'
```

The full list is available via `TrezorConnect.getCoinInfo({ coin: 'btc' })`.
