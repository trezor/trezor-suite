## Bitcoin: get Ownership identifier

Export SLIP-0019 ownership identifier. [Read more](https://github.com/satoshilabs/slips/blob/master/slip-0019.md#ownership-identifier)

```javascript
const result = await TrezorConnect.getOwnershipId(params);
```

> :note: **Supported only by T2T1 with Firmware 2.4.4 or higher!**

### Params

[Optional common params](commonParams.md)

#### Exporting single id

-   `path` — _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `coin` - _optional_ `string`
    > Determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file.
    > Coin `shortcut`, `name` or `label` can be used.
-   `scriptType` — _optional_ `InputScriptType`
-   `multisig` — _optional_ `MultisigRedeemScriptType`

#### Exporting bundle of ids

-   `bundle` - `Array` of Objects with fields listed above.

### Example

Display id of the first bitcoin address:

```javascript
TrezorConnect.getOwnershipId({
    path: "m/86'/0'/0'/0/0",
});
```

Return a bundle of ids:

```javascript
TrezorConnect.getOwnershipId({
    bundle: [
        { path: "m/86'/0'/0'/0/0" }, // taproot
        { path: "m/84'/0'/0'/0/0" }, // bech32
        { path: "m/49'/0'/0'/0/0" }, // segwit
    ],
});
```

### Result

[OwnershipId type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/getOwnershipId.ts)

Result with single id:

```javascript
{
    success: true,
    payload: {
        ownership_id: string,
        path: number[],
        serializedPath: string
    }
}
```

Result with bundle of ids sorted by FIFO

```javascript
{
    success: true,
    payload: [
        { ownership_id: string, path: number[], serializedPath: string }, // taproot
        { ownership_id: string, path: number[], serializedPath: string }, // bech32
        { ownership_id: string, path: number[], serializedPath: string }  // segwit
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
