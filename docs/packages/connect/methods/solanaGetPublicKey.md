## Solana: get public key

Display requested public key derived by given [BIP44 path](../path.md) on device and return it to the caller. User is presented with a description of the requested public key and asked to confirm the export on Trezor.

```javascript
const result = await TrezorConnect.solanaGetPublicKey(params);
```

### Params

[Optional common params](commonParams.md)

[GetPublicKey type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/params.ts)

#### Exporting single key

-   `path` — _required_ `string | Array<number>` minimum length is `2`. [read more](../path.md)
-   `showOnTrezor` — _optional_ `boolean` determines if public key will be displayed on device. Default is set to `true`

#### Exporting bundle of public keys

-   `bundle` - `Array` of Objects with `path` and `showOnTrezor` fields

### Example

Display public key of first Solana account:

```javascript
TrezorConnect.solanaGetPublicKey({
    path: "m/44'/501'/0'/0'",
});
```

Return a bundle of Solana public keys without displaying them on device:

```javascript
TrezorConnect.solanaGetPublicKey({
    bundle: [
        { path: "m/44'/501'/0'", showOnTrezor: false }, // account 1
        { path: "m/44'/501'/1'", showOnTrezor: false }, // account 2
        { path: "m/44'/501'/2'", showOnTrezor: false }, // account 3
    ],
});
```

### Result

[SolanaPublicKey type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/solana/index.ts)

Result with only one public key

```javascript
{
    success: true,
    payload: {
        path: Array<number>, // hardended path
        serializedPath: string,
        publicKey: string,
    }
}
```

Result with a bundle of public keys

```javascript
{
    success: true,
    payload: [
        { path: Array<number>, serializedPath: string, publicKey: string }, // account 1
        { path: Array<number>, serializedPath: string, publicKey: string }, // account 2
        { path: Array<number>, serializedPath: string, publicKey: string }  // account 3
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
