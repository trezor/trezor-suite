## Get public key

Retrieves BIP32 extended public derived by given BIP32 path.
User is presented with a description of the requested key and asked to confirm the export.

```javascript
const result = await TrezorConnect.getPublicKey(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single public key

-   `path` — _required_ `string | Array<number>` minimum length is `1`. [read more](../path.md)
-   `coin` - _optional_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used. If `coin` is not set API will try to get network definition from `path`.
-   `scriptType` — _optional_ `string` used to distinguish between various address formats (non-segwit, segwit, etc.).
-   `ignoreXpubMagic` — _optional_ `boolean` ignore SLIP-0132 XPUB magic, use xpub/tpub prefix for all account types.
-   `ecdsaCurveName` — _optional_ `string` ECDSA curve name to use
-   `crossChain` — _optional_ `boolean` Advanced feature. Use it only if you are know what you are doing. Allows to generate address between chains. For example Bitcoin path on Litecoin network will display cross chain address in Litecoin format.
-   `unlockPath` - _optional_ [PROTO.UnlockPath](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts), the result of [TrezorConnect.unlockPath](./unlockPath.md) method.
-   `suppressBackupWarning` - _optional_ `boolean` By default, this method will emit an event to show a warning if the wallet does not have a backup. This option suppresses the message.

#### Exporting bundle of public keys

-   `bundle` - `Array` of Objects with `path`, `coin` and `crossChain` fields

### Example

Return public key of fifth bitcoin account:

```javascript
TrezorConnect.getPublicKey({
    path: "m/49'/0'/4'",
    coin: 'btc',
});
```

Return a bundle of public keys for multiple bitcoin accounts:

```javascript
TrezorConnect.getPublicKey({
    bundle: [
        { path: "m/49'/0'/0'" }, // account 1
        { path: "m/49'/0'/1'" }, // account 2
        { path: "m/49'/0'/2'" }, // account 3
    ],
});
```

### Result

[HDNodeResponse type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/getPublicKey.ts)

Result with only one public key

```javascript
{
    success: true,
    payload: {
        path: Array<number>, // hardended path
        serializedPath: string, // serialized path
        xpub: string,        // xpub in legacy format
        xpubSegwit?: string, // optional for segwit accounts: xpub in segwit format
        chainCode: string,   // BIP32 serialization format
        childNum: number,    // BIP32 serialization format
        publicKey: string,   // BIP32 serialization format
        fingerprint: number, // BIP32 serialization format
        depth: number,       // BIP32 serialization format
    }
}
```

[Read more about BIP32 serialization format](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#Serialization_format)

Result with bundle of public keys

```javascript
{
    success: true,
    payload: [
        { path, serializedPath, xpub, xpubSegwit?, chainCode, childNum, publicKey, fingerprint, depth }, // account 1
        { path, serializedPath, xpub, xpubSegwit?, chainCode, childNum, publicKey, fingerprint, depth }, // account 2
        { path, serializedPath, xpub, xpubSegwit?, chainCode, childNum, publicKey, fingerprint, depth }  // account 3
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
