## Ethereum: Sign Typed Data

Asks device to sign an [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed data message using the private key derived by given BIP32 path.

User is asked to confirm all signing details on T2T1.

```javascript
const result = await TrezorConnect.ethereumSignTypedData(params);
```

> :warning: **Supported only by T2T1 with Firmware 2.4.3 or higher!**
> :warning: **Blind signing is supported only on T1B1 with Firmware 1.10.5 or higher!**

### Params

[Optional common params](commonParams.md)

[EthereumSignTypedData type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

> :warning: **Domain-only signing (`data.primaryType` = `"EIP712Domain"`) is supported only on T2T1 with Firmware 2.4.4 or higher!**

-   `path` — _required_ `string | Array<number>` minimum length is `3`. [read more](../path.md)
-   `data` - _required_ `Object` type of [`EthereumSignTypedDataMessage`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)`. A JSON Schema definition can be found in the [EIP-712 spec](https://eips.ethereum.org/EIPS/eip-712).
-   `metamask_v4_compat` - _required_ `boolean` set to `true` for compatibility with [MetaMask's signTypedData_v4](https://docs.metamask.io/guide/signing-data.html#sign-typed-data-v4).

#### Blind signing (optional addition for T1B1 compatibility)

T1B1 firmware currently does not support constructing EIP-712
hashes.

However, it supports signing pre-constructed hashes.

EIP-712 hashes can be constructed with the plugin function at
[@trezor/connetct-plugin-ethereum](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-plugin-ethereum).

You may also wish to contruct your own hashes using a different library.

[EthereumSignTypedHash type](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/api/ethereum/index.ts)

> :warning: **Domain-only signing (empty `message_hash`) is supported only on T1B1 with Firmware 1.10.6 or higher!**

-   `domain_separator_hash` - _required_ `string` hex-encoded 32-byte hash of the EIP-712 domain.
-   `message_hash` - _optional_ `string` hex-encoded 32-byte hash of the EIP-712 message.
    This is optional for the domain-only hashes where `primaryType` is `EIP712Domain`.

### Example

```javascript
const eip712Data = {
    types: {
        EIP712Domain: [
            {
                name: 'name',
                type: 'string',
            },
        ],
        Message: [
            {
                name: 'Best Wallet',
                type: 'string',
            },
            {
                name: 'Number',
                type: 'uint64',
            },
        ],
    },
    primaryType: 'Message',
    domain: {
        name: 'example.trezor.io',
    },
    message: {
        'Best Wallet': 'Trezor Model T',
        // be careful with JavaScript numbers: MAX_SAFE_INTEGER is quite low
        Number: `${2n ** 55n}`,
    },
};

// This functionality is separate from @trezor/connect, as it requires @metamask/eth-sig-utils,
// which is a large JavaScript dependency
const transformTypedDataPlugin = require('@trezor/connect-plugin-ethereum');
const { domain_separator_hash, message_hash } = transformTypedDataPlugin(eip712Data, true);

TrezorConnect.ethereumSignTypedData({
    path: "m/44'/60'/0'",
    data: eip712Data,
    metamask_v4_compat: true,
    // These are optional, but required for T1B1 compatibility
    domain_separator_hash,
    message_hash,
});
```

### Result

[EthereumMessageSignature type](https://github.com/trezor/trezor-suite/blob/develop/packages/protobuf/src/messages.ts)

```javascript
{
    success: true,
    payload: {
        address: string,
        signature: string, // hexadecimal string with "0x" prefix
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
