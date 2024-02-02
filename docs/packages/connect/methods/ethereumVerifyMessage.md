## Ethereum: verify message

Asks device to
verify a message using the signer address and signature.

```javascript
const result = await TrezorConnect.ethereumVerifyMessage(params);
```

### Params

[Optional common params](commonParams.md)

[EthereumVerifyMessage type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

-   `address` - _required_ `string` signer address. "0x" prefix is optional
-   `message` - _required_ `string` signed message in plain text
-   `hex` - _optional_ `boolean` convert message from hex
-   `signature` - _required_ `string` signature in hexadecimal format. "0x" prefix is optional

### Example

```javascript
TrezorConnect.ethereumVerifyMessage({
    address: '0xdA0b608bdb1a4A154325C854607c68950b4F1a34',
    message: 'Example message',
    signature:
        '11dc86c631ef5d9388c5e245501d571b864af1a717cbbb3ca1f6dacbf330742957242aa52b36bbe7bb46dce6ff0ead0548cc5a5ce76d0aaed166fd40cb3fc6e51c',
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
