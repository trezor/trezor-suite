## Ethereum: sign message

Asks device to sign a message using the private key derived by given BIP32 path.

```javascript
const result = await TrezorConnect.ethereumSignMessage(params);
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L64-L67)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](path.md)
-   `message` - _required_ `string` message to sign in plain text
-   `hex` - _optional_ `boolean` convert message from hex

### Example

```javascript
TrezorConnect.ethereumSignMessage({
    path: "m/44'/60'/0'",
    message: 'example message',
});
```

### Result

###### [flowtype](../../src/js/types/response.js#L47-L50)

```javascript
{
    success: true,
    payload: {
        address: string,
        signature: string,
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

### Migration from older version

version 4 and below

```javascript
TrezorConnect.ethereumSignMessage("m/44'/60'/0'", 'example message', function (result) {
    result.address; // address without "0x" prefix
    result.signature;
});
```

version 5

```javascript
// params are key-value pairs inside Object
TrezorConnect.ethereumSignMessage({
    path: "m/44'/60'/0'",
    message: 'example message',
}).then(function (result) {
    result.address; // address with "0x" prefix and checksum
    result.signature; // no change
});
```
