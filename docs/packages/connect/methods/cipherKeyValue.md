## Symmetric key-value encryption

Cipher key value provides symmetric encryption in the Trezor device where the user might be forced to confirm the encryption/decryption on the display. The key for the encryption is constructed from the private key on the BIP address, the key displayed on the device, and the two informations about whether to ask for confirmation. It is constructed in such a way, that different path, key or the confirm information will get a different encryption key and IV. So, you cannot "skip" the confirmation by using different input. IV can be either manually set, or it is computed together with the key.The value must be divisible into 16-byte blocks. The application has to pad the blocks itself and ensure safety; for example, by using PKCS7.

More information can be found in [SLIP-0011](https://github.com/satoshilabs/slips/blob/master/slip-0011.md).

```javascript
const result = await TrezorConnect.cipherKeyValue(params);
```

### Params

[Optional common params](commonParams.md)

Common parameter `useEmptyPassphrase` - is always set to `true` and it will be ignored by this method

#### Encrypt single value

-   `path` — _required_ `string | Array<number>` minimum length is `1`. [read more](../path.md)
-   `key` — _optional_ `string` a message shown on device
-   `value` — _optional_ `string` hexadecimal value with length a multiple of 16 bytes (32 letters in hexadecimal). Value is what is actually being encrypted.
-   `askOnEncrypt` - _optional_ `boolean` should user confirm encrypt?
-   `askOnDecrypt` - _optional_ `boolean` should user confirm decrypt?
-   `iv` - _optional_ `string` initialization vector - keep unset if you don't know what it means, it will be computed automatically.

#### Encrypt multiple values

-   `bundle` - `Array` of Objects with `path`, `key`, `value`, `askOnEncrypt`, `askOnDecrypt` fields

### Example

Return encrypted value:

```javascript
TrezorConnect.cipherKeyValue({
    path: "m/49'/0'/0'",
    key: 'This text is displayed on Trezor during encrypt',
    value: '1c0ffeec0ffeec0ffeec0ffeec0ffee1',
    encrypt: true,
    askOnEncrypt: true,
    askOnDecrypt: true,
});
```

Return a bundle of encrypted values:

```javascript
TrezorConnect.cipherKeyValue({
    bundle: [
        {
            path: "m/49'/0'/0'",
            key: '1 text on Trezor',
            value: '1c0ffeec0ffeec0ffeec0ffeec0ffee1',
            encrypt: true,
        },
        {
            path: "m/49'/0'/1'",
            key: '2 text on Trezor',
            value: '1c0ffeec0ffeec0ffeec0ffeec0ffee1',
            encrypt: false,
        },
        { path: "m/49'/0'/2'", key: '3 text on Trezor', value: '1c0ffeec0ffeec0ffeec0ffeec0ffee1' },
    ],
});
```

### Result

[CipheredValue type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/cipherKeyValue.ts)

Result with only one value

```javascript
{
    success: true,
    payload: {
        value: string
    }
}
```

Result with bundle of values

```javascript
{
    success: true,
    payload: [
        { value: string },
        { value: string },
        { value: string }
    ]
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
