## Ethereum: Sign transaction

Asks device to sign given transaction using the private key derived by given BIP32 path. User is asked to confirm all transaction
details on Trezor.

```javascript
const result = await TrezorConnect.ethereumSignTransaction(params);
```

### Params

[\***\*Optional common params\*\***](commonParams.md)

###### [flowtype](../../src/js/types/params.js#L69-L72)

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](path.md)
-   `transaction` - _required_ `Object` type of [`EthereumTransactionEIP1559`](../../src/js/types/networks/ethereum.js#L46)`|`[`EthereumSignTransaction`](../../src/js/types/networks/ethereum.js#L59) "0x" prefix for each field is optional

### Examples

#### EIP1559 ([after The London Upgrade](https://ethereum.org/en/developers/docs/gas/#post-london))

> :warning: **Supported firmware versions** Trezor 1 v1.10.4 and Trezor T v2.4.2

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

For Trezor One and Trezor T with firmware older than 2.4.2 (but supported newer firmware versions too).

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

###### [flowtype](../../src/js/types/api.js#L252)

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

### Migration from older version

version 4 and below

```javascript
TrezorConnect.ethereumSignTx(
    "m/44'/60'/0'", // path
    '0', // nonce - hexadecimal string without "0x" prefix
    'bebc200', // gas_price - hexadecimal string without "0x" prefix
    '5208', // gas_limit - hexadecimal string without "0x" prefix
    '7314e0f1c0e28474bdb6be3e2c3e0453255188f8', // address without "0x" prefix
    'f4240', // value in wei, hexadecimal string without "0x" prefix
    '01', // data, hexadecimal string OR null for no data without "0x" prefix
    1, // chain id for EIP-155 - is only used in fw 1.4.2 and newer, older will ignore it
    function (result) {
        result.v; // number
        result.r; // hexadecimal string without "0x" prefix
        result.s; // hexadecimal string without "0x" prefix
    },
);
```

version 5

```javascript
// params are key-value pairs inside Object
TrezorConnect.signTransaction({
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
}).then(function (result) {
    result.v; // hexadecimal string with "0x" prefix
    result.r; // hexadecimal string with "0x" prefix
    result.s; // hexadecimal string with "0x" prefix
});
```
