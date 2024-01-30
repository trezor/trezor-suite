## Eos: sign transaction

Asks device to sign given transaction using the private key derived by given [BIP44 path](../path.md). User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.eosSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[EosSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/eos/index.ts)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `transaction` - _required_ `Object` type of [EosSDKTransaction](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/eos/index.ts)
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### Transfer example

```javascript
TrezorConnect.eosSignTransaction({
    path: "m/44'/194'/0'/0/0",
    transaction: {
        chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
        header: {
            expiration: '2019-12-01T12:00:00',
            refBlockNum: 6439,
            refBlockPrefix: 2995713264,
            maxNetUsageWords: 0,
            maxCpuUsageMs: 0,
            delaySec: 0,
        },
        actions: [
            {
                account: 'eosio.token',
                authorization: [
                    {
                        actor: 'abcdefg12345',
                        permission: 'active',
                    },
                ],
                name: 'transfer',
                data: {
                    from: 'abcdefg12345',
                    to: '12345abcdefg',
                    quantity: '1.0000 EOS',
                    memo: 'memo',
                },
            },
        ],
    },
});
```

### Result

[EosSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        signature: string, // hexadecimal string
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
