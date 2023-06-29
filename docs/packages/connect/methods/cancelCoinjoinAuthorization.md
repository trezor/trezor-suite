## Bitcoin: cancel coinjoin authorization

Clear device's authorization for coinjoin-related operations.

```javascript
const result = await TrezorConnect.cancelCoinjoinAuthorization(params);
```

> :warning: **This feature is experimental! Do not use it in production!**

> :note: **Supported only by TT with Firmware 2.5.3 or higher!**

### Params

[Optional common params](commonParams.md)

### Example:

```javascript
TrezorConnect.cancelCoinjoinAuthorization({
    device,
    useEmptyPassphrase: device?.useEmptyPassphrase,
});
```

### Result

[Success type](https://github.com/trezor/trezor-suite/blob/develop/packages/transport/src/types/messages.ts)

```javascript
{
    success: true,
    payload: {
        message: 'Authorization cancelled'
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
