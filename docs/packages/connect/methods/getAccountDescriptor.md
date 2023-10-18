## Get account descriptor

Gets an descriptor of specified account.

```javascript
const result = await TrezorConnect.getAccountDescriptor(params);
```

### Params

[Optional common params](commonParams.md)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.
-   `derivationType` — _optional_ `CardanoDerivationType` enum. determines used derivation type. Default is set to ICARUS_TREZOR=2
-   `suppressBackupWarning` - `boolean` By default, this method will emit an event to show a warning if the wallet does not have a backup. This option suppresses the message.

### Example

Get descriptor of first bitcoin account

```javascript
TrezorConnect.getAccountDescriptor({
    path: "m/49'/0'/0'",
    coin: 'btc',
});
```

### Result

[AccountInfo type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/account.ts)

```javascript
{
    success: true,
    payload: {
        id: number,                           // account id
        path: string,                         // serialized path
        descriptor: string,                   // account public key
        legacyXpub?: string,                  // (optional) account public key in legacy format (only for segwit and segwit native accounts)

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
