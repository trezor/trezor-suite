## Binance: sign transaction

Asks device to sign given transaction using the private key derived by given [BIP44 path](../path.md). User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.binanceSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

-   `path` — _required_ `string | Array<number>` minimum length is `5`. [read more](../path.md)
-   `transaction` - _required_ `Object` type of [BinanceSDKTransaction](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/binance/index.ts)
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### Transfer example

```javascript
TrezorConnect.binanceSignTransaction({
    path: "m/44'/714'/0'/0/0",
    transaction: {
        chain_id: 'Binance-Chain-Nile',
        account_number: 34,
        memo: 'test',
        sequence: 31,
        source: 1,
        transfer: {
            inputs: [
                {
                    address: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                    coins: [{ amount: 1000000000, denom: 'BNB' }],
                },
            ],
            outputs: [
                {
                    address: 'tbnb1ss57e8sa7xnwq030k2ctr775uac9gjzglqhvpy',
                    coins: [{ amount: 1000000000, denom: 'BNB' }],
                },
            ],
        },
    },
});
```

### Place order example

```javascript
TrezorConnect.binanceSignTransaction({
    path: "m/44'/714'/0'/0/0",
    transaction: {
        chain_id: 'Binance-Chain-Nile',
        account_number: 34,
        memo: '',
        sequence: 32,
        source: 1,
        placeOrder: {
            id: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-33',
            ordertype: 2,
            price: 100000000,
            quantity: 100000000,
            sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
            side: 1,
            symbol: 'ADA.B-B63_BNB',
            timeinforce: 1,
        },
    },
});
```

### Cancel order example

```javascript
TrezorConnect.binanceSignTransaction({
    path: "m/44'/714'/0'/0/0",
    transaction: {
        chain_id: 'Binance-Chain-Nile',
        account_number: 34,
        memo: '',
        sequence: 33,
        source: 1,
        cancelOrder: {
            refid: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-29',
            sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
            symbol: 'BCHSV.B-10F_BNB',
        },
    },
});
```

### Result

[BinanceSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        signature: string,
        public_key: string,
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
