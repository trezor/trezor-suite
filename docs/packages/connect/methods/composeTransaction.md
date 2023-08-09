# Compose transaction

This method works only for `Bitcoin` and `Bitcoin-like` coins.

Can be used in two different ways and returned result depends on used parameters.

## Requests a payment to a set of given outputs.

An automated payment process separated in to following steps:

1. Account discovery for requested coin is performed and the user is asked for source account selection. [[1]](#additional-notes)
1. User is asked for fee level selection.
1. Transaction is calculated, change output is added automatically if needed. [[2]](#additional-notes)
1. Signing transaction with Trezor, user is asked for confirmation on device.

Returned response is a signed transaction in hexadecimal format same as in [signTransaction method](signTransaction.md#result).

## Params:

[Optional common params](commonParams.md)

-   `outputs` — _required_ `Array` of output objects described [below](#accepted-output-objects)
-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.
-   `push` — _optional_ `boolean` determines if composed transaction will be broadcasted into blockchain network. Default is set to false.
-   `sequence` — _optional_ `number` transaction input field used in RBF or locktime transactions

## Precompose, prepare transaction to be signed by Trezor.

Skip first two steps of `payment request` (described above) by providing `account` and `feeLevels` params and perform **only** transaction calculation. [[2]](#additional-notes)

The result, internally called [`PrecomposedTransaction`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/composeTransaction.ts) is a set of params that can be used in [signTransaction method](signTransaction.md#params) afterwards.

This useful for the quick preparation of multiple variants for the same transaction using different fee levels or using incomplete data (like missing output addresses just to calculate fee)

_Device and backend connection is not required for this case since all data are provided._

## Params:

-   `outputs` — _required_ `Array` of output objects described [below](#accepted-output-objects)
-   `coin` — _required_ `string` determines network definition specified in [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file. Coin `shortcut`, `name` or `label` can be used.
-   `account` — _required_ `Object` containing essential data, partial result of [getAccountInfo method](getAccountInfo.md#result)
    -   `path` - _required_ `string`
    -   `utxo` - _required_ `Array`
    -   `addresses` - _required_ `string`
-   `feeLevels` — _required_ `Array` of objects. set of requested variants, partial result of `blockchainEstimateFee method`
    -   `feePerUnit` - _required_ `string` satoshi per transaction byte.
-   `baseFee` — _optional_ `number` base fee of transaction in satoshi. used in replacement transactions calculation (RBF) and DOGE
-   `floorBaseFee` — _optional_ `boolean` decide whenever baseFee should be floored to the nearest baseFee unit, prevents from fee overpricing. used in DOGE
-   `sequence` — _optional_ `number` transaction input field used in RBF or locktime transactions
-   `skipPermutation` — _optional_ `boolean` do not sort calculated inputs/outputs (usage: RBF transactions)

## Accepted output objects:

-   `regular output`
    -   `amount` - _required_ `string` value to send in satoshi
    -   `address` - _required_ `string` recipient address
-   `send-max` - spends all available inputs from account
    -   `type` - _required_ with `send-max` value
    -   `address` - _required_ `string` recipient address
-   `opreturn` - [read more](https://trezor.io/learn/a/use-op_return-in-trezor-suite-app)
    -   `type` - _required_ with `opreturn` value
    -   `dataHex` - _required_ `hexadecimal string` with arbitrary data
-   `payment-noaddress` - incomplete output, target address is not known yet. used only in precompose
    -   `type` - _required_ with `payment-noaddress` value
    -   `amount` - _required_ `string` value to send in satoshi
-   `send-max-noaddress` - incomplete output, target address is not known yet. used only in precompose
    -   `type` - _required_ with `send-max-noaddress` value

## Examples

### Payment example

Send 0.002 BTC to "18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2"

```javascript
TrezorConnect.composeTransaction({
    outputs: [
        { amount: "200000", address: "18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2" }
    ]
    coin: "btc",
    push: true
});
```

### Payment result

[SignedTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/composeTransaction.ts)

```javascript
{
    success: true,
    payload: {
        signatures: Array<string>, // signer signatures
        serializedTx: string,      // serialized transaction
        txid?: string,             // blockchain transaction id
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

### Precompose example

Prepare multiple variants of the same transaction

```javascript
TrezorConnect.composeTransaction({
    outputs: [{ amount: '200000', address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu' }],
    coin: 'btc',
    account: {
        path: "m/84'/0'/0'",
        addresses: {
            used: [
                {
                    address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                    path: "m/84'/0'/0'/0/0",
                    transfers: 1,
                },
            ],
            unused: [
                {
                    address: '',
                    path: "m/84'/0'/0'/0/1",
                    transfers: 0,
                },
            ],
            change: [
                {
                    address: 'bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q',
                    path: "m/84'/0'/0'/1/0",
                    transfers: 0,
                },
            ],
        },
        utxo: [
            {
                txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                vout: 0,
                amount: '300000',
                blockHeight: 590093,
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                path: "m/84'/0'/0'/0/0",
                confirmations: 100,
            },
        ],
    },
    feeLevels: [{ feePerUnit: '1' }, { feePerUnit: '5' }, { feePerUnit: '30' }],
});
```

### Precompose result

```javascript
{
    success: true,
    payload: [
        {
            type: 'final',
            totalSpent: '200167',
            fee: '167',
            feePerByte: '1',
            bytes: 167,
            inputs: [
                {
                    address_n: [84 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 0, 0],
                    amount: "300000",
                    prev_hash: "86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36",
                    prev_index: 0,
                    script_type: "SPENDWITNESS",
                }
            ],
            outputs: [
                {
                    address_n: [84 | 0x80000000, 1 | 0x80000000, 0 | 0x80000000, 1, 0],
                    amount: "99833",
                    script_type: "PAYTOWITNESS",
                },
                {
                    address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
                    amount: '200000',
                    script_type: 'PAYTOADDRESS',
                }
            ],
            outputsPermutation: [1, 0],
        },
        {
            type: 'final',
            totalSpent: '200835',
            fee: '835',
            feePerByte: '5',
            bytes: 167,
            inputs: [{ ... }],
            outputs: [{ ... }],
            outputsPermutation: [],
        },
        {
            type: 'error',
        }
    ]
}
```

For more examples see

### Additional notes

-   [1] `UI.SELECT_ACCOUNT` and `UI.SELECT_FEE` events are emitted when using `trusted mode`
-   [2] Account utxo selection, fee and change calculation is performed by [@trezor/utxo-lib](https://github.com/trezor/trezor-suite/tree/develop/packages/utxo-lib/src/compose) module
