# Get Device State

Return information about a specific device. Devices without passphrase enabled return the same per instance.

[Device state](commonParams.md) can be used in any method (key derivation or TX signing) to enforce the same passphrase on furhter operations.

```javascript
const result = await TrezorConnect.getDeviceState(params);
```

### Params

[Optional common params](commonParams.md)

## Example

Get the state of a device.

```javascript
const capturedDevice = await TrezorConnect.getDeviceState({
    device: {
        instance: 0, // identificator for wallet A
        // `state: undefined` forces the passphrase prompt even if instance 0 is/was already using "some" pasphrase (let say empty). The Trezor forgets the current state, useful when dealing with multiple hidden wallets on one or more devices
        // `state: "string" verifies state is valid, otherwise "invalid passphrase" error is returned
        state: undefined,
    },
});

// Get the public key without prompting for the passphrase again
await TrezorConnect.getPublicKey({
    device: {
        instance: 0,
        state: capturedDevice.payload.state, // by using a previously capture state identifier, passphrase will not be re-requested
    },
});
```

### Result

[DeviceStateResponse type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/getDeviceState.ts)

```javascript
{
  id: 1,
  success: true,
  payload: {
    state: "string"
  }
}
```
