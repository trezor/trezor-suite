## Bitcoin: authorize coinjoin

Allow device to do preauthorized operations in `signTransaction` and `getOwnershipProof` methods without further user interaction.

Permission persists until physical device disconnection or `maxRounds` limit is reached.

```javascript
const result = await TrezorConnect.authorizeCoinjoin(params);
```

> :warning: **This feature is experimental! Do not use it in production!**

> :note: **Supported only by T2T1 with Firmware 2.5.3 or higher!**

### Params

[Optional common params](commonParams.md)

#### Exporting single id

-   `path` — _required_ `string | Array<number>`
    > prefix of the BIP-32 path leading to the account (m / purpose' / coin_type' / account')[read more](../path.md)
-   `coordinator` — _required_ `string`
    > coordinator identifier to approve as a prefix in commitment data (max. 36 ASCII characters)
-   `maxRounds` — _required_ `number`
    > maximum number of rounds that Trezor is authorized to take part in
-   `maxCoordinatorFeeRate` — _required_ `number`
    > maximum coordination fee rate in units of 10\*\*6 percent
-   `maxFeePerKvbyte` — _required_ `number`
    > maximum mining fee rate in units of satoshis per 1000 vbytes
-   `coin` - _optional_ `string`
    > Determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file.
    > Coin `shortcut`, `name` or `label` can be used.
-   `scriptType` — _optional_ `PROTO.InputScriptType`
    > used to distinguish between various address formats (non-segwit, segwit, etc.)
-   `amountUnit` — _optional_ `PROTO.AmountUnit`
    > show amounts in
-   `preauthorized` — _optional_
    > Check if device session is already preauthorized and take no further action if so
-   `coinjoinRequest` — _optional_ `PROTO.CoinJoinRequest`
    > Signing request for a coinjoin transaction

### Example:

```javascript
TrezorConnect.authorizeCoinjoin({
    path: "m/10086'/0'/0'",
    maxRounds: 3,
    maxCoordinatorFeeRate: 500000, // 0.5% => 0.005 * 10**8;
    maxFeePerKvbyte: 3500,
    scriptType: 'SPENDWITNESS',
});
```

### Result

Success type

```javascript
{
    success: true,
    payload: {
        message: 'Coinjoin authorized'
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
