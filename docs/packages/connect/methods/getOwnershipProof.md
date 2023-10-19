## Bitcoin: get Ownership proof

Export SLIP-0019 ownership proof. [Read more](https://github.com/satoshilabs/slips/blob/master/slip-0019.md#proof-usage)

```javascript
const result = await TrezorConnect.getOwnershipProof(params);
```

> :note: **Supported only by T2T1 with Firmware 2.4.4 or higher!**

### Params

[Optional common params](commonParams.md)

#### Exporting single proof

-   `path` — _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `coin` - _optional_ `string`
    > Determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file.
    > Coin `shortcut`, `name` or `label` can be used.
-   `scriptType` — _optional_ `InputScriptType`
-   `userConfirmation` — _optional_ `boolean`
-   `ownershipIds` — _optional_ `Array<string>`
-   `commitmentData` — _optional_ `string`
-   `multisig` — _optional_ `MultisigRedeemScriptType`
-   `preauthorized` — _optional_ `boolean` [read more](./authorizeCoinjoin.md)

#### Exporting bundle of proofs

-   `bundle` - `Array` of Objects with fields listed above.

### Example

Display ownership proof of the first bitcoin address:

```javascript
TrezorConnect.getOwnershipProof({
    path: "m/86'/0'/0'/0/0",
});
```

Return a bundle of ownership proofs:

```javascript
TrezorConnect.getOwnershipProof({
    bundle: [
        { path: "m/86'/0'/0'/0/0" }, // taproot
        { path: "m/84'/0'/0'/0/0" }, // bech32
        { path: "m/49'/0'/0'/0/0" }, // segwit
    ],
});
```

### Result

[OwnershipProof type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/getOwnershipProof.ts)

Result with single proof:

```javascript
{
    success: true,
    payload: {
        ownership_proof: string,
        signature: string,
        path: number[],
        serializedPath: string
    }
}
```

Result with bundle of proofs sorted by FIFO

```javascript
{
    success: true,
    payload: [
        { ownership_proof: string, signature: string, path: number[], serializedPath: string }, // taproot
        { ownership_proof: string, signature: string, path: number[], serializedPath: string }, // bech32
        { ownership_proof: string, signature: string, path: number[], serializedPath: string }  // segwit
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
