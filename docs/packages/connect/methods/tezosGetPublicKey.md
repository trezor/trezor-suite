## Tezos: get public key

Display requested public key on device and returns it to caller.
User is presented with a description of the requested public key and asked to confirm the export.

```javascript
const result = await TrezorConnect.tezosGetPublicKey(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single public key

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `showOnTrezor` — _optional_ `boolean` determines if public key will be displayed on device.
-   `chunkify` — _optional_ `boolean` determines if address will be displayed in chunks of 4 characters. Default is set to `false`

#### Exporting bundle of public keys

-   `bundle` - `Array` of Objects with `path` and `showOnTrezor` fields

### Example

Result with only one public key

```javascript
TrezorConnect.tezosGetPublicKey({
    path: "m/49'/1729'/0'",
});
```

Result with bundle of public keys

```javascript
TrezorConnect.tezosGetPublicKey({
    bundle: [
        { path: "m/49'/1729'/0'" }, // account 1
        { path: "m/49'/1729'/1'" }, // account 2
        { path: "m/49'/1729'/2'" }, // account 3
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
        publicKey: string,
        path: Array<number>,
        serializedPath: string,
    }
}
```

Result with bundle of public keys

```javascript
{
    success: true,
    payload: [
        { path, serializedPath, publicKey }, // account 1
        { path, serializedPath, publicKey }, // account 2
        { path, serializedPath, publicKey }, // account 3
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
