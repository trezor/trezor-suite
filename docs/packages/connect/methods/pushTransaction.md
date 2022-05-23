## Push transaction

Broadcast the transaction to the selected network.

```javascript
const result = await TrezorConnect.pushTransaction(params);
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L119-L22)

-   `tx` - _required_ `string` serialized transaction,
-   `coin` - _required_ `string` Determines network definition specified in [coins.json](../../src/data/coins.json) file. Coin `shortcut`, `name` or `label` can be used.

### Example

```javascript
TrezorConnect.pushTransaction({
    tx: '010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006b4830450221009a0b7be0d4ed3146ee262b42202841834698bb3ee39c24e7437df208b8b7077102202b79ab1e7736219387dffe8d615bbdba87e11477104b867ef47afed1a5ede7810121023230848585885f63803a0a8aecdd6538792d5c539215c91698e315bf0253b43dffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000',
    coin: 'btc',
});
```

### Result

###### [flowtype](../../src/js/types/response.js#L94-L96)

```javascript
{
    success: true,
    payload: {
        txid: string, // transaction id
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

### Migration from older version

version 4 and below

```javascript
var tx = "010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006b4830450221009a0b7be0d4ed3146ee262b42202841834698bb3ee39c24e7437df208b8b7077102202b79ab1e7736219387dffe8d615bbdba87e11477104b867ef47afed1a5ede7810121023230848585885f63803a0a8aecdd6538792d5c539215c91698e315bf0253b43dffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000";
TrezorConnect.pushTransaction(tx, function(result) {
    ...
});
```

version 5

```javascript
// params are key-value pairs inside Object
TrezorConnect.pushTransaction({
    tx: "010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006b4830450221009a0b7be0d4ed3146ee262b42202841834698bb3ee39c24e7437df208b8b7077102202b79ab1e7736219387dffe8d615bbdba87e11477104b867ef47afed1a5ede7810121023230848585885f63803a0a8aecdd6538792d5c539215c91698e315bf0253b43dffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000",
    coin: "btc"
}).then(function(result) {
    ...
})
```
