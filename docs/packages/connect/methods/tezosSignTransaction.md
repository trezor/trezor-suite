## Tezos: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.tezosSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[TezosSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/tezos/index.ts)

-   `path` - _required_ `string | Array<number>`
-   `branch` - _required_ `string`
-   `operation` - _required_ `Object` type of [TezosOperation](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/tezos/index.ts)
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### Example

Sign transaction operation

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/10'",
    branch: 'BLGUkzwvguFu8ei8eLW3KgCbdtrMmv1UCqMvUpHHTGq1UPxypHS',
    operation: {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'tz1Kef7BSg6fo75jk37WkKRYSnJDs69KVqt9',
            counter: 297,
            amount: 200000,
            fee: 10000,
            gas_limit: 11000,
            storage_limit: 0,
        },
    },
});
```

Sign the first transaction of the account with reveal operation

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/10'",
    branch: 'BLGUkzwvguFu8ei8eLW3KgCbdtrMmv1UCqMvUpHHTGq1UPxypHS',
    operation: {
        reveal: {
            source: 'tz1ekQapZCX4AXxTJhJZhroDKDYLHDHegvm1',
            counter: 575424,
            fee: 10000,
            gas_limit: 20000,
            storage_limit: 0,
            public_key: 'edpkuTPqWjcApwyD3VdJhviKM5C13zGk8c4m87crgFarQboF3Mp56f',
        },
        transaction: {
            source: 'tz1ekQapZCX4AXxTJhJZhroDKDYLHDHegvm1',
            destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            counter: 575425,
            amount: 100000,
            fee: 10000,
            gas_limit: 20000,
            storage_limit: 0,
        },
    },
});
```

Sign origination operation

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BLHRTdZ5vUKSDbkp5vcG1m6ZTST4SRiHWUhGodysLTbvACwi77d',
    operation: {
        origination: {
            source: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
            manager_pubkey: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
            delegate: 'tz1boot1pK9h2BVGXdyvfQSv8kd1LQM6H889',
            balance: 100000000,
            fee: 10000,
            counter: 20450,
            gas_limit: 10100,
            storage_limit: 277,
            script: '0000001c02000000170500036805010368050202000000080316053d036d03420000000a010000000568656c6c6f',
        },
    },
});
```

Sign delegation operation

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BMXAKyvzcH1sGQMqpvqXsZGskYU4GuY9Y14c9g3LcNzMRtfLzFa',
    operation: {
        delegation: {
            source: 'tz1Kef7BSg6fo75jk37WkKRYSnJDs69KVqt9',
            delegate: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            fee: 20000,
            counter: 564565,
            gas_limit: 20000,
            storage_limit: 0,
        },
    },
});
```

Sign delegation from a KT account (smart contract with `manager.tz` script)

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BMdPMLXNyMTDp4vR6g7y8mWPk7KZbjoXH3gyWD1Tze43UE3BaPm',
    operation: {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
            counter: 292,
            amount: 0,
            fee: 10000,
            gas_limit: 36283,
            storage_limit: 0,
            parameters_manager: {
                set_delegate: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            },
        },
    },
});
```

Sign cancel delegation from a KT account (smart contract with `manager.tz` script)

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BL6oaFJeEjtYxafJqEL8hXvSCZmM5d4quyAqjzkBhXvrX97JbQs',
    operation: {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
            counter: 293,
            amount: 0,
            fee: 10000,
            gas_limit: 36283,
            storage_limit: 0,
            parameters_manager: {
                cancel_delegate: true,
            },
        },
    },
});
```

Sign transaction operation from a KT account (smart contract with `manager.tz` script) to a tz account (implicit account)

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BMCKRpEsFYQTdZy8BSLuFqkHmxwXrnRpKncdoVMbeGoggLG3bND',
    operation: {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
            counter: 294,
            amount: 0,
            fee: 10000,
            gas_limit: 36283,
            storage_limit: 0,
            parameters_manager: {
                transfer: {
                    amount: 200,
                    destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                },
            },
        },
    },
});
```

Sign transaction operation from a KT account (smart contract with `manager.tz` script) to another KT account (smart contract with `manager.tz` script)

```javascript
TrezorConnect.tezosSignTransaction({
    path: "m/44'/1729'/0'",
    branch: 'BMCKRpEsFYQTdZy8BSLuFqkHmxwXrnRpKncdoVMbeGoggLG3bND',
    operation: {
        transaction: {
            source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
            destination: 'KT1SBj7e8ZhV2VvJtoc73dNRDLRJ9P6VjuVN',
            counter: 294,
            amount: 0,
            fee: 10000,
            gas_limit: 36283,
            storage_limit: 0,
            parameters_manager: {
                transfer: {
                    amount: 200,
                    destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                },
            },
        },
    },
});
```

### Result

[TezosSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        signature: string,
        sig_op_contents: string,
        operation_hash: string,
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
