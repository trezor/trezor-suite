## Verify message

Asks device to
verify a message using the signer address and signature.

```javascript
const result = await TrezorConnect.verifyMessage(params);
```

### Params

[Optional common params](commonParams.md)

[VerifyMessage type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/bitcoin/index.ts)

-   `address` - _required_ `string` signer address,
-   `message` - _required_ `string` signed message,
-   `signature` - _required_ `string` signature in base64 format,
-   `coin` - _required_ `string` Determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.
-   `hex` - _optional_ `boolean` convert message from hex

### Example

```javascript
TrezorConnect.verifyMessage({
    address: '3BD8TL6iShVzizQzvo789SuynEKGpLTms9',
    message: 'example message',
    signature:
        'JO7vL3tOB1qQyfSeIVLvdEw9G1tCvL+lNj78XDAVM4t6UptADs3kXDTO2+2ZeEOLFL4/+wm+BBdSpo3kb3Cnsas=',
    coin: 'btc',
});
```

### Result

Success type

```javascript
{
    success: true,
    payload: {
        message: "Message verified"
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
