## Ethereum: Sign transaction

Asks device to sign given transaction using the private key derived by given BIP32 path. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.ethereumSignTransaction(params);
```

### Params

[Optional common params](commonParams.md)

[EthereumSignTransaction type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `transaction` - _required_ `Object` type of [`EthereumTransactionEIP1559`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)`|`[`EthereumSignTransaction`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts) "0x" prefix for each field is optional
-   `chunkify` — _optional_ `boolean` determines if recipient address will be displayed in chunks of 4 characters. Default is set to `false`

### Examples

#### EIP1559 ([after The London Upgrade](https://ethereum.org/en/developers/docs/gas/#post-london))

> :warning: **Supported firmware versions** T1B1 v1.10.4 and T2T1 v2.4.2

If both parameters `maxFeePerGas` and `maxPriorityFeePerGas` are defined, transaction will be signed as the new type introduced in [EIP1559](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1559.md).

```javascript
TrezorConnect.ethereumSignTransaction({
    path: "m/44'/60'/0'",
    transaction: {
        to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
        value: '0xf4240',
        data: '0xa',
        chainId: 1,
        nonce: '0x0',
        maxFeePerGas: '0x14',
        maxPriorityFeePerGas: '0x0',
        gasLimit: '0x14',
    },
});
```

#### Legacy

For T1B1 and T2T1 with firmware older than 2.4.2 (but supported newer firmware versions too).

```javascript
TrezorConnect.ethereumSignTransaction({
    path: "m/44'/60'/0'",
    transaction: {
        to: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
        value: '0xf4240',
        data: '0x01',
        chainId: 1,
        nonce: '0x0',
        gasLimit: '0x5208',
        gasPrice: '0xbebc200',
    },
});
```

### Result

[EthereumSignedTx type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

```javascript
{
    success: true,
    payload: {
        v: string, // hexadecimal string with "0x" prefix
        r: string, // hexadecimal string with "0x" prefix
        s: string, // hexadecimal string with "0x" prefix
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
