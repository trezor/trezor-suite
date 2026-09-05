# @trezor/connect – Device Model & Compatibility

## Device Types

A `TrezorDevice` received from `DEVICE_EVENT` is one of three types:

```typescript
type Device =
    | { type: 'acquired';   ... }  // normal — has features, firmware, state
    | { type: 'unacquired'; ... }  // connected but used by another app
    | { type: 'unreadable'; ... }  // communication error (old Bridge, wrong permissions)
```

Always check `device.type === 'acquired'` before accessing `device.features`.

---

## Device Models

| Model constant | Consumer name               |
| -------------- | --------------------------- |
| `T1B1`         | Trezor Model One            |
| `T2T1`         | Trezor Model T              |
| `T2B1`         | Trezor Safe 3               |
| `T3T1`         | Trezor Safe 5 (touchscreen) |
| `T3B1`         | Trezor Safe 3 (updated)     |
| `T3W1`         | Trezor Safe 7 (Bluetooth)   |

---

## Device Status & Mode

```typescript
// device.status
'available'; // ready for use
'occupied'; // session held by another call
'used'; // passphrase required
'pin-locked'; // PIN not entered yet
'thp-locked'; // THP pairing required
'bootloader-locked';
'hard-locked';
'rebooting';
'busy';

// device.mode
'normal'; // fully initialized wallet
'bootloader'; // firmware update mode
'initialize'; // no seed — needs setup
'seedless'; // intentionally no seed (watch-only)
```

---

## Firmware Status

```typescript
// device.firmware
'valid'; // up to date
'outdated'; // works but an update is available
'required'; // too old — method will be rejected
'custom'; // unofficial firmware
'unknown';
'none'; // bootloader mode, no firmware
```

If firmware is `'required'`, API calls will fail with error code `Device_FwException`.
Prompt the user to update via `TrezorConnect.firmwareUpdate()`.

---

## UnavailableCapabilities

Some methods are not available on all device/firmware combinations.
Check `device.unavailableCapabilities` before calling:

```typescript
const caps = device.unavailableCapabilities;

// Possible values per capability key:
// 'no-capability'          — device hardware doesn't support this at all
// 'no-support'             — not supported on this model
// 'update-required'        — needs firmware update
// 'trezor-connect-outdated'— SDK needs to be updated

if (caps['taproot']) {
    showMessage('Taproot not available. Please update firmware.');
} else {
    // safe to call signTransaction with P2TR
}
```

Common capability keys: `'taproot'`, `'coinjoin'`, `'eip1559'`, `'signTypedData'`, `'cardano'`.

---

## Firmware Version Requirements

Each API method defines a minimum firmware version per device model.
If the device firmware is too old, the call returns:

```typescript
{ success: false, error: { code: 'Device_FwException', message: '...' } }
```

Always check `device.firmware !== 'required'` in your UI before allowing sensitive operations.

---

## Multiple Devices & Multiple Passphrases

When multiple devices are connected, target a specific one via `device.path`:

```typescript
await TrezorConnect.getAddress({
    device: { path: device.path },
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
});
```

Multiple passphrase wallets on the same device use `instance`:

```typescript
// instance 0 — default wallet (no passphrase or passphrase A)
// instance 1 — second wallet (passphrase B)
await TrezorConnect.getAddress({
    device: { path: device.path, instance: 1 },
    path: "m/49'/0'/0'/0/0",
    coin: 'btc',
});
```

The `device.state.staticSessionId` is the stable cross-session identifier for a passphrase wallet.
Store it to re-attach to the same wallet in future sessions without re-prompting the passphrase.

---

## requestLogin (Challenge-Response Authentication)

Authenticate users with their Trezor device (no seed phrase exposed):

```typescript
const result = await TrezorConnect.requestLogin({
    challengeHidden: 'server-nonce-hex',
    challengeVisual: 'Login to My App – 2024-01-15',
});
if (result.success) {
    const { address, publicKey, signature } = result.payload;
    // Send to your server for ECDSA verification
}
```

---

## authenticateDevice

Verify the device is a genuine Trezor (uses OPTIGA/TROPIC secure element):

```typescript
const result = await TrezorConnect.authenticateDevice({
    expectedFirmwareHash: '...', // optional: verify specific firmware
});
if (result.success) {
    console.log(result.payload.valid); // boolean
}
```
