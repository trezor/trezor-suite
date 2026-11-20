# @trezor/connect – Events

## Subscribing to Events

```typescript
import TrezorConnect, {
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    UI_EVENT,
} from '@trezor/connect';

TrezorConnect.on(DEVICE_EVENT, event => { ... });
TrezorConnect.on(TRANSPORT_EVENT, event => { ... });
TrezorConnect.on(BLOCKCHAIN_EVENT, event => { ... });
TrezorConnect.on(UI_EVENT, event => { ... });

// Unsubscribe
TrezorConnect.off(DEVICE_EVENT, handler);
TrezorConnect.removeAllListeners(DEVICE_EVENT);
```

---

## DEVICE_EVENT

Fired when a device connects, disconnects, or its state changes.

| Sub-event type              | When                                                     |
| --------------------------- | -------------------------------------------------------- |
| `device-connect`            | Device connected and ready                               |
| `device-connect_unacquired` | Device found but not acquired (e.g. used by another app) |
| `device-disconnect`         | Device unplugged                                         |
| `device-changed`            | Device state changed (firmware, passphrase, etc.)        |

```typescript
import { DEVICE } from '@trezor/connect';

TrezorConnect.on(DEVICE_EVENT, event => {
    if (event.type === DEVICE.CONNECT) {
        const device = event.payload;
        console.log(device.label); // "My Trezor"
        console.log(device.type); // 'acquired' | 'unacquired' | 'unreadable'
        if (device.type === 'acquired') {
            console.log(device.features); // full device capabilities
            console.log(device.firmware); // 'valid' | 'outdated' | 'required' | ...
            console.log(device.status); // 'available' | 'occupied' | 'pin-locked' | ...
            console.log(device.mode); // 'normal' | 'bootloader' | 'initialize' | 'seedless'
            console.log(device.unavailableCapabilities); // { [key]: 'no-capability' | 'update-required' | ... }
        }
    }

    if (event.type === DEVICE.DISCONNECT) {
        console.log(event.payload.path); // USB path of disconnected device
    }
});
```

---

## TRANSPORT_EVENT

Fired once during `init()` to report transport status.

```typescript
import { TRANSPORT } from '@trezor/connect';

TrezorConnect.on(TRANSPORT_EVENT, event => {
    if (event.type === TRANSPORT.START) {
        console.log('Transport ready:', event.payload.type); // 'BridgeTransport' etc.
    }
    if (event.type === TRANSPORT.ERROR) {
        console.error('No transport available:', event.payload.error);
        // Prompt user to install Trezor Bridge
    }
});
```

---

## BLOCKCHAIN_EVENT

Fired by blockchain subscriptions. Does NOT require a connected device.

```typescript
import { BLOCKCHAIN } from '@trezor/connect';

TrezorConnect.on(BLOCKCHAIN_EVENT, event => {
    if (event.type === BLOCKCHAIN.CONNECT) {
        console.log('Backend connected:', event.payload.coin.shortcut);
    }
    if (event.type === BLOCKCHAIN.BLOCK) {
        console.log('New block:', event.payload.blockHeight);
    }
    if (event.type === BLOCKCHAIN.NOTIFICATION) {
        // Transaction arrived for a subscribed address
        console.log('Tx:', event.payload.notification.tx);
    }
    if (event.type === BLOCKCHAIN.FIAT_RATES_UPDATE) {
        console.log('BTC/USD:', event.payload.rates?.['usd']);
    }
    if (event.type === BLOCKCHAIN.ERROR) {
        console.error('Backend error:', event.payload.error);
    }
});
```

---

## UI_EVENT – The UI Interaction Loop

Some device operations require user input (PIN, passphrase) or on-device confirmation.
The library emits `UI_EVENT` and waits for `TrezorConnect.uiResponse()`.

**In browser environments with a popup**, this is handled automatically.
**In custom UI / Node.js**, you must handle it manually:

```typescript
import { UI } from '@trezor/connect';

TrezorConnect.on(UI_EVENT, event => {
    if (event.type === UI.REQUEST_PIN) {
        // Show PIN matrix to user, collect their input
        const pin = await collectPinFromUser();
        TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin });
    }

    if (event.type === UI.REQUEST_PASSPHRASE) {
        const passphrase = await collectPassphraseFromUser();
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: { value: passphrase, passphraseOnDevice: false, save: true },
        });
    }

    if (event.type === UI.REQUEST_BUTTON) {
        // Just inform the user to press the button on the device — no response needed
        showMessage('Please confirm on your Trezor device');
    }

    if (event.type === UI.ADDRESS_VALIDATION) {
        // Device is displaying the address — show it in your UI simultaneously
        console.log('Verify this address on device:', event.payload.address);
    }
});
```

### Address Validation Pattern

To display an address in your UI while the device shows it simultaneously,
register an `ADDRESS_VALIDATION` listener **before** calling `getAddress`:

```typescript
TrezorConnect.on(UI_EVENT, event => {
    if (event.type === UI.ADDRESS_VALIDATION) {
        highlightAddressInUI(event.payload.address);
    }
});

const result = await TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
    showOnTrezor: true,
});
```

---

## Bundle Progress Events

When using bundle calls, progress is reported via `UI.BUNDLE_PROGRESS`:

```typescript
TrezorConnect.on(UI_EVENT, event => {
    if (event.type === UI.BUNDLE_PROGRESS) {
        console.log(`Item ${event.payload.progress + 1} done`, event.payload.response);
    }
});
```
