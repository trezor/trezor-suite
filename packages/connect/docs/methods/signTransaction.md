## Sign transaction

Asks device to sign given
inputs and outputs of pre-composed transaction. User is asked to confirm all transaction
details on Trezor.

ES6

```javascript
const result = await TrezorConnect.signTransaction(params);
```

CommonJS

```javascript
TrezorConnect.signTransaction(params).then(function (result) {});
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L169-L164)

-   `coin` - _required_ `string` Determines network definition specified in [coins.json](../../src/data/coins.json) file. Coin `shortcut`, `name` or `label` can be used.
-   `inputs` - _required_ `Array` of [TransactionInput](../../src/js/types/trezor/protobuf.js#L100-L108),
-   `outputs` - _required_ `Array` of [TransactionOutput](../../src/js/types/trezor/protobuf.js#L113-L131),
-   `refTxs` - _optional_ `Array` of [RefTransaction](../../src/js/types/trezor/protobuf.js#L139-L144). If you don't want to use build-in `blockbook` backend you can optionally provide those data from your own backend transformed to `Trezor` format. Since Firmware 2.3.0/1.9.0 referenced transactions are required. Zcash and Komodo refTxs should also contains `expiry`, `version_group_id` and `extra_data` fields.
-   `locktime` - _optional_ `number`,
-   `version` - _optional_ `number` transaction version,
-   `expiry` - _optional_ `number`, only for Decred and Zcash,
-   `versionGroupId` - _optional_ `number` only for Zcash, nVersionGroupId when overwintered is set,
-   `overwintered` - _optional_ `boolean` only for Zcash
-   `timestamp` - _optional_ `number` only for Capricoin, transaction timestamp,
-   `branchId` - _optional_ `number`, only for Zcash, BRANCH_ID when overwintered is set
-   `push` - _optional_ `boolean` Broadcast signed transaction to blockchain. Default is set to false

### Example

###### PAYTOADDRESS

```javascript
TrezorConnect.signTransaction({
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                0,
            ],
            prev_index: 0,
            prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac',
        },
    ],
    outputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                1,
            ],
            amount: '3181747',
            script_type: 'PAYTOADDRESS',
        },
        {
            address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
            amount: '200000',
            script_type: 'PAYTOADDRESS',
        },
    ],
    coin: 'btc',
});
```

###### SPENDP2SHWITNESS

```javascript
TrezorConnect.signTransaction({
    inputs: [
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                0,
            ],
            prev_index: 0,
            prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac',
            amount: '3382047',
            script_type: 'SPENDP2SHWITNESS',
        },
    ],
    outputs: [
        {
            address_n: [
                (49 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                1,
            ],
            amount: '3181747',
            script_type: 'PAYTOP2SHWITNESS',
        },
        {
            address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
            amount: '200000',
            script_type: 'PAYTOADDRESS',
        },
    ],
    coin: 'btc',
});
```

###### PAYTOADDRESS with refTxs (transaction data provided from custom backend)

```javascript
TrezorConnect.signTransaction({
    inputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                0,
            ],
            prev_index: 0,
            prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac',
        },
    ],
    outputs: [
        {
            address_n: [
                (44 | 0x80000000) >>> 0,
                (0 | 0x80000000) >>> 0,
                (2 | 0x80000000) >>> 0,
                1,
                1,
            ],
            amount: '3181747',
            script_type: 'PAYTOADDRESS',
        },
        {
            address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
            amount: '200000',
            script_type: 'PAYTOADDRESS',
        },
    ],
    refTxs: [
        {
            hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac',
            inputs: [
                {
                    prev_hash: '448946a44f1ef514601ccf9b22cc3e638c69ea3900b67b87517ea673eb0293dc',
                    prev_index: 0,
                    script_sig:
                        '47304402202872cb8459eed053dcec0f353c7e293611fe77615862bfadb4d35a5d8807a4cf022015057aa0aaf72ab342b5f8939f86f193ad87b539931911a72e77148a1233e022012103f66bbe3c721f119bb4b8a1e6c1832b98f2cf625d9f59242008411dd92aab8d94',
                    sequence: 4294967295,
                },
            ],
            bin_outputs: [
                {
                    amount: 3431747,
                    script_pubkey: '76a91441352a84436847a7b660d5e76518f6ebb718dedc88ac',
                },
                {
                    amount: 10000,
                    script_pubkey: '76a9141403b451c79d34e6a7f6e36806683308085467ac88ac',
                },
            ],
            lock_time: 0,
            version: 1,
        },
    ],
    coin: 'btc',
});
```

### Result

###### [flowtype](../../src/js/types/response.js#sign-transaction)

```javascript
{
    success: true,
    payload: {
        signatures: Array<string>, // Array of signer signatures
        serializedTx: string,        // serialized transaction
        txid?: string,             // broadcasted transaction id
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
var inputs = [
    {
        address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 0],
        prev_index: 0,
        prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac',
    },
];
var outputs = [
    {
        address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 1],
        amount: 3181747,
        script_type: 'PAYTOADDRESS',
    },
    {
        address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
        amount: 200000,
        script_type: 'PAYTOADDRESS',
    },
];
TrezorConnect.setCurrency('BTC');
TrezorConnect.signTx(
    inputs, // amount field retyped to a string
    outputs, // amount field retyped to a string
    'example message',
    function (result) {
        result.signatures; // not changed
        result.serialized_tx; // renamed to "serializedTx"
        // added "txid" field if "push" is set to true
    },
    'bitcoin',
);
```

version 5

```javascript
// params are key-value pairs inside Object
TrezorConnect.signTransaction({
    inputs: [{
        address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 0],
        prev_index: 0,
        prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac'
    }],
    outputs: [{
        address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 1],
        amount: '3181747',
        script_type: 'PAYTOADDRESS'
    }, {
        address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
        amount: '200000',
        script_type: 'PAYTOADDRESS'
    }],
    coin: "btc"
}).then(function(result) {
    ...
})
```
