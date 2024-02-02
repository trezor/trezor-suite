## Ethereum: sign message

Asks device to sign a message using the private key derived by given BIP32 path.

```javascript
const result = await TrezorConnect.ethereumSignMessage(params);
```

### Params

[Optional common params](commonParams.md)
[EthereumSignMessage type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
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

[MessageSignature type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

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
