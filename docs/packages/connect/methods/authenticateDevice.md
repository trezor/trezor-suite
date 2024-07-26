## authenticateDevice

> :note: **Not supported on T1B1 and T2T1**

Request a signature and validate certificate issued by the Trezor company.
Returns [DeviceAuthenticityResult type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/authenticateDevice.ts)

### Params

[Optional common params](commonParams.md)

-   `config` — _optional_ [`DeviceAuthenticityConfig`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/authenticateDevice.ts)

### Example

```javascript
TrezorConnect.authenticateDevice({ config });
```

### Result

```javascript
{
    success: true,
    payload: DeviceAuthenticityResult
}
```
