## Binance: get public key

Display requested public key derived by given [BIP44 path](../path.md) on device and returns it to caller.
User is presented with a description of the requested public key and asked to confirm the export.

```javascript
const result = await TrezorConnect.binanceGetPublicKey(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single address

-   `path` — _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `showOnTrezor` — _optional_ `boolean` determines if address will be displayed on device. Default is set to `true`

#### Exporting bundle of addresses

-   `bundle` - `Array` of Objects with `path` and `showOnTrezor` fields

### Example

Displays public key derived from BIP44 path:

```javascript
TrezorConnect.binanceGetPublicKey({
    path: "m/44'/714'/0'/0/0",
});
```

Return a bundle of public keys without displaying them on device:

```javascript
TrezorConnect.binanceGetPublicKey({
    bundle: [
        { path: "m/44'/714'/0'/0/0", showOnTrezor: false }, // public key 1
        { path: "m/44'/714'/1'/0/0", showOnTrezor: false }, // public key 2
        { path: "m/44'/714'/2'/0/0", showOnTrezor: false }, // public key 3
    ],
});
```

### Result

[PublicKey type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/params.ts)

Result with only one public key

```javascript
{
    success: true,
    payload: {
        path: Array<number>,
        serializedPath: string,
        publicKey: string,
    }
}
```

Result with bundle of public keys sorted by FIFO

```javascript
{
    success: true,
    payload: [
        { path: Array<number>, serializedPath: string, publicKey: string }, // public key 1
        { path: Array<number>, serializedPath: string, publicKey: string }, // public key 2
        { path: Array<number>, serializedPath: string, publicKey: string }  // public key 3
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
