# @trezor/connect – Error Handling

## The Error Shape

Every failed call returns:

```typescript
{
    success: false,
    error: {
        message: string,  // human-readable description
        code: string,     // machine-readable ErrorCode
    }
}
```

Never access `result.payload` without first checking `result.success === true`.

---

## Error Codes Reference

### Initialization Errors

| Code                      | Cause                   | Fix                           |
| ------------------------- | ----------------------- | ----------------------------- |
| `Init_ManifestMissing`    | No manifest in `init()` | Add required `manifest` field |
| `Init_AlreadyInitialized` | `init()` called twice   | Call `dispose()` first        |

### Transport Errors

| Code                        | Cause                  | Fix                                                          |
| --------------------------- | ---------------------- | ------------------------------------------------------------ |
| `Transport_Missing`         | No transport available | Prompt user to install Trezor Bridge or use a WebUSB browser |
| `Desktop_ConnectionMissing` | Desktop IPC lost       | Reconnect or fall back to web transport                      |

### Device Errors

| Code                              | Cause                                            | Fix                                           |
| --------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `Device_NotFound`                 | No device connected                              | Prompt user to connect their Trezor           |
| `Device_Disconnected`             | Device unplugged mid-call                        | Handle DEVICE_EVENT disconnect; retry         |
| `Device_CallInProgress`           | Another call is running                          | Queue calls; don't run in parallel            |
| `Device_FwException`              | Firmware too old                                 | Prompt firmware update via `firmwareUpdate()` |
| `Device_ModeException`            | Device in wrong mode (bootloader, uninitialized) | Check `device.mode` first                     |
| `Device_MissingCapability`        | Feature not supported by device                  | Check `device.unavailableCapabilities`        |
| `Device_MissingCapabilityBtcOnly` | Feature requires non-BTC-only firmware           | Inform user they need the full firmware       |

### Method Errors

| Code                           | Cause                              | Fix                                              |
| ------------------------------ | ---------------------------------- | ------------------------------------------------ |
| `Method_Cancel`                | User pressed Cancel on device      | Normal cancellation — show friendly message      |
| `Method_Interrupted`           | Another method was called mid-flow | Ensure only one call at a time                   |
| `Method_Override`              | A newer call replaced this one     | Ignore the older result                          |
| `Method_InvalidParameter`      | Bad params passed                  | Fix the params (check types and required fields) |
| `Method_PermissionsNotGranted` | User denied permissions            | Inform user that the operation was cancelled     |
| `Method_NoResponse`            | Device did not respond in time     | Retry or check connection                        |

---

## Recommended Handling Patterns

### Basic guard

```typescript
const result = await TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc' });

if (!result.success) {
    if (result.error.code === 'Method_Cancel') {
        // User pressed cancel — not an error, just exit silently
        return;
    }
    if (result.error.code === 'Device_NotFound') {
        showPrompt('Please connect your Trezor device');
        return;
    }
    // Unexpected error
    console.error('[TrezorConnect]', result.error.code, result.error.message);
    showError('Something went wrong. Please try again.');
    return;
}

// Safe to use result.payload here
```

### Transport check on startup

```typescript
import { TRANSPORT_EVENT, TRANSPORT } from '@trezor/connect';

TrezorConnect.on(TRANSPORT_EVENT, event => {
    if (event.type === TRANSPORT.ERROR) {
        showInstallBridgePrompt();
    }
});

await TrezorConnect.init({ manifest: { ... } });
```

### Serializing calls (avoid Device_CallInProgress)

The device can only handle one call at a time. Use a queue:

```typescript
let callQueue = Promise.resolve();

function trezorCall<T>(fn: () => Promise<T>): Promise<T> {
    callQueue = callQueue.then(fn);
    return callQueue as Promise<T>;
}

// Usage
const result = await trezorCall(() =>
    TrezorConnect.getAddress({ path: "m/49'/0'/0'/0/0", coin: 'btc' }),
);
```

### Firmware update prompt

```typescript
TrezorConnect.on(DEVICE_EVENT, event => {
    if (event.type === DEVICE.CONNECT && event.payload.type === 'acquired') {
        const { firmware } = event.payload;
        if (firmware === 'required') {
            showFirmwareRequired();
        } else if (firmware === 'outdated') {
            showFirmwareOutdatedBanner();
        }
    }
});
```

---

## Testing Without Hardware

Use the Trezor emulator via [trezor-user-env](https://github.com/trezor/trezor-user-env).
The emulator communicates over UDP transport:

```typescript
await TrezorConnect.init({
    manifest: { email: 'dev@test.com', appUrl: 'localhost' },
    transports: [{ type: 'UdpTransport', port: 21324 }],
});
```
