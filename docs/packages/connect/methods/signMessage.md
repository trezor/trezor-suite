## Sign message

Asks device to sign a message using the private key derived by given BIP32 path.

```javascript
const result = await TrezorConnect.signMessage(params);
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L131-L135)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](path.md)
-   `message` - _required_ `string`
-   `coin` - _optional_ `string` Determines network definition specified in [coins.json](../../src/data/coins.json) file. Coin `shortcut`, `name` or `label` can be used. If `coin` is not set API will try to get network definition from `path`.
-   `hex` - _optional_ `boolean` convert message from hex

### Example

```javascript
TrezorConnect.signMessage({
    path: "m/44'/0'/0'",
    message: 'example message',
});
```

### Result

###### [flowtype](../../src/js/types/response.js#L113-L116)

```javascript
{
    success: true,
    payload: {
        address: string,   // signer address
        signature: string, // signature in base64 format
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
