## getFirmwareHash

> :note: **Supported only by firmwares 1.11.1 and 2.5.1 or higher!**

### Params

[Optional common params](commonParams.md)

-   `challenge` — _required_ `string` a random 32-byte challenge which is return form successful [TrezorConnect.firmwareUpdate](./firmwareUpdate) call

### Example

Get hash of firmware installed in trezor device. It can be used to verify authenticity of firmware binaries intended to be installed.

```javascript
TrezorConnect.getFirmwareHash({
    challenge: '430d1ca5302edb40ac605e0ba61dc50928779336fdd02b688a833564c178307c',
});
```

### Result

[FirmwareHash type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        hash: string,
    }
}
```

Error

```javascript
{
    success: false,
    payload: {
        error: string // error message
    }
}
```
