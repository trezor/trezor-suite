# @trezor/connect – API Methods Reference

## Device Management

### getFeatures

Returns full device capabilities and state (firmware version, model, capabilities, etc.).

```typescript
const result = await TrezorConnect.getFeatures();
if (result.success) {
    console.log(result.payload.model); // 'T2T1', 'T3T1', etc.
    console.log(result.payload.major_version);
    console.log(result.payload.minor_version);
    console.log(result.payload.bootloader_mode);
    console.log(result.payload.initialized); // false = needs setup
}
```

### getDeviceState

Returns the current session state (passphrase identifier).

```typescript
const result = await TrezorConnect.getDeviceState();
if (result.success) {
    console.log(result.payload.state); // use as device.state in subsequent calls
}
```

---

## Account & Address Methods

### getAddress

Get a receiving address for Bitcoin-compatible coins.

```typescript
const result = await TrezorConnect.getAddress({
    path: "m/49'/0'/0'/0/0", // BIP49 P2SH-P2WPKH
    coin: 'btc',
    showOnTrezor: true, // prompt user to verify on device
});
if (result.success) {
    const { address, path, serializedPath } = result.payload;
}
```

### getPublicKey

Get the extended public key (xpub) for an account.

```typescript
const result = await TrezorConnect.getPublicKey({
    path: "m/49'/0'/0'",
    coin: 'btc',
});
if (result.success) {
    const { xpub, xpubSegwit, chainCode, publicKey, fingerprint, depth } = result.payload;
}
```

### getAccountInfo

Get full account information: balance, transactions, UTXOs, descriptor.

```typescript
const result = await TrezorConnect.getAccountInfo({
    path: "m/49'/0'/0'",
    coin: 'btc',
    details: 'txs', // 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs'
    page: 1,
    pageSize: 25,
});
if (result.success) {
    const { balance, availableBalance, transactions, utxo, descriptor } = result.payload;
}
```

### discoverAccounts

Discover all used accounts for one or more coins via BIP44 gap-limit discovery.

```typescript
const result = await TrezorConnect.discoverAccounts({
    bundle: [
        { coin: 'btc', type: 'p2wpkh' }, // native segwit
        { coin: 'btc', type: 'p2sh' }, // segwit
        { coin: 'eth' },
    ],
});
if (result.success) {
    for (const account of result.payload) {
        console.log(account.descriptor, account.empty, account.balance);
    }
}
```

Account types: `'p2pkh'` (legacy), `'p2sh'` (segwit), `'p2wpkh'` (native segwit), `'p2tr'` (taproot)

---

## Bitcoin

### signTransaction

Sign a pre-built Bitcoin transaction. Inputs and outputs must include the derivation path.

```typescript
const result = await TrezorConnect.signTransaction({
    inputs: [
        {
            address_n: [0x80000000 | 49, 0x80000000 | 0, 0x80000000 | 0, 0, 0],
            prev_hash: 'abcd1234...',
            prev_index: 0,
            amount: '100000', // in satoshis (string)
            script_type: 'SPENDP2SHWITNESS',
        },
    ],
    outputs: [
        {
            address: '3RecipientAddress...',
            amount: '90000',
            script_type: 'PAYTOADDRESS',
        },
        {
            // change output — use address_n instead of address
            address_n: [0x80000000 | 49, 0x80000000 | 0, 0x80000000 | 0, 1, 0],
            amount: '9000',
            script_type: 'PAYTOP2SHWITNESS',
        },
    ],
    coin: 'btc',
    push: false, // set true to broadcast automatically
});
if (result.success) {
    const { serializedTx, signatures } = result.payload;
}
```

### composeTransaction

Build AND sign a transaction from a list of outputs; the library selects UTXOs automatically.

```typescript
const result = await TrezorConnect.composeTransaction({
    outputs: [{ address: '3Recipient...', amount: '50000' }],
    coin: 'btc',
    push: true,
    account: {
        path: "m/49'/0'/0'",
        addresses: { ... },  // from getAccountInfo
        utxo: [ ... ],
    },
    feeLevels: [{ label: 'normal' }],
});
```

### signMessage / verifyMessage

```typescript
const signed = await TrezorConnect.signMessage({
    path: "m/44'/0'/0'/0/0",
    message: 'Hello Trezor',
    coin: 'btc',
});

const verified = await TrezorConnect.verifyMessage({
    address: '1Address...',
    message: 'Hello Trezor',
    signature: signed.payload.signature,
    coin: 'btc',
});
```

---

## Ethereum / EVM

### ethereumGetAddress

```typescript
const result = await TrezorConnect.ethereumGetAddress({
    path: "m/44'/60'/0'/0/0",
    showOnTrezor: true,
});
// result.payload.address — EIP-55 checksummed address
```

### ethereumSignTransaction (EIP-1559)

```typescript
const result = await TrezorConnect.ethereumSignTransaction({
    path: "m/44'/60'/0'/0/0",
    transaction: {
        to: '0xRecipient...',
        value: '0xDE0B6B3A7640000', // 1 ETH in hex wei
        data: '0x',
        chainId: 1, // mainnet
        nonce: '0x0',
        maxFeePerGas: '0x4A817C800',
        maxPriorityFeePerGas: '0x3B9ACA00',
        gasLimit: '0x5208',
    },
});
if (result.success) {
    const { v, r, s, serializedTx } = result.payload;
}
```

### ethereumSignTypedData (EIP-712)

```typescript
const result = await TrezorConnect.ethereumSignTypedData({
    path: "m/44'/60'/0'/0/0",
    data: {
        types: { EIP712Domain: [...], MyStruct: [...] },
        primaryType: 'MyStruct',
        domain: { name: 'My App', version: '1', chainId: 1 },
        message: { ... },
    },
    metamask_v4_compat: true,
});
// result.payload.signature — hex string
```

Note: T1B1 (Model One) requires pre-hashed variant (`ethereumSignTypedData` with
`domain_separator_hash` and `message_hash`). T2T1+ supports full EIP-712.

### ethereumSignMessage

```typescript
const result = await TrezorConnect.ethereumSignMessage({
    path: "m/44'/60'/0'/0/0",
    message: 'Hello from Trezor',
    hex: false,
});
// result.payload.signature — Ethereum personal_sign compatible
```

---

## Blockchain Subscriptions (no device needed)

### blockchainSubscribe

```typescript
await TrezorConnect.blockchainSubscribe({
    accounts: [
        { descriptor: 'xpub6...', coin: 'btc' },
        { descriptor: '0xAddress...', coin: 'eth' },
    ],
    coin: 'btc',
});
// New transactions fire BLOCKCHAIN_EVENT with type BLOCKCHAIN.NOTIFICATION
```

### blockchainEstimateFee

```typescript
const result = await TrezorConnect.blockchainEstimateFee({
    coin: 'btc',
    request: { feeLevels: 'preloaded' }, // or { feeLevels: 'smart', blocks: [1, 3, 6] }
});
if (result.success) {
    for (const level of result.payload.levels) {
        console.log(level.label, level.feePerUnit, level.blocks);
    }
}
```

### pushTransaction

```typescript
const result = await TrezorConnect.pushTransaction({
    tx: 'rawHexTransaction',
    coin: 'btc',
});
// result.payload.txid
```

---

## Other Coins (Quick Reference)

| Coin       | Address             | Sign Tx                  |
| ---------- | ------------------- | ------------------------ |
| Cardano    | `cardanoGetAddress` | `cardanoSignTransaction` |
| Ripple/XRP | `rippleGetAddress`  | `rippleSignTransaction`  |
| Solana     | `solanaGetAddress`  | `solanaSignTransaction`  |
| Stellar    | `stellarGetAddress` | `stellarSignTransaction` |
| Tezos      | `tezosGetAddress`   | `tezosSignTransaction`   |
| Tron       | `tronGetAddress`    | `tronSignTransaction`    |
| Monero     | `moneroGetAddress`  | `moneroSignTransaction`  |

All follow the same success/error response pattern.
