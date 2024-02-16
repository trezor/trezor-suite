## Stellar: Sign transaction

Asks device to sign given transaction. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.stellarSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[StellarSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/stellar/index.ts)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `networkPassphrase` - _required_ `string` network passphrase
-   `transaction` - _required_ `Object` type of [StellarTransaction](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/stellar/index.ts)

### Stellar SDK compatibility

`@stellar/stellar-sdk` is not a part of `trezor-connect` repository.
To transform `StellarSDK.Transaction` object into `TrezorConnect.StellarTransaction`, install [@trezor/connect-plugin-stellar](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-plugin-stellar) into your project.

```javascript
import * as StellarSDK from '@stellar/stellar-sdk';
import transformTrezorTransaction from '<path-to-plugin>/index.js';

const tx = new StellarSdk.TransactionBuilder(...);
...
tx.build();

const params = transformTrezorTransaction(tx);
const result = TrezorConnect.stellarSignTransaction(params);

if (result.success) {
    tx.addSignature('account-public-key', result.payload.signature);
}
```

### Example

```javascript
TrezorConnect.stellarSignTransaction(
    path: "m/44'/148'/0'",
    networkPassphrase: "Test SDF Network ; September 2015",
    transaction: {
        source: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
        fee: 100,
        sequence: 4294967296,
        memo: {
            type: 0,
        },
        operations: [
            {
                type: "payment",
                source: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
                destination: "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
                amount: "10000"
            }
        ]
    }
});
```

### Result

[StellarSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/stellar/index.ts)

```javascript
{
    success: true,
    payload: {
        publicKey: string,
        signature: string,
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
