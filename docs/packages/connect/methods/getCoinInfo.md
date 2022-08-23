## Get Coin Info

Returns information about a specified coin from the [coins.json](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/coins.json) file.

```javascript
const result = await TrezorConnect.getCoinInfo(params);
```

### Params

[Optional common params](commonParams.md)

#### Exporting single address

-   `coin` — _required_ `string` coin symbol (btc, eth, bch, ...).

### Example

Get coin info for Bitcoin.

```javascript
TrezorConnect.getCoinInfo({
    coin: 'btc',
});
```

### Result

Result for Bitcoin

[BitcoinNetworkInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/types/coinInfo.ts)

```javascript
{
    success: true,
    payload: {
        blockchainLink: Object { type: "blockbook", url: (5) […] },
        blocks: 10,
        blocktime: 10,
        cashAddrPrefix: null,
        curveName: "secp256k1",
        decimals: 8,
        defaultFees: Object { Economy: 70, High: 200, Low: 10, … },
        dustLimit: 546,
        forceBip143: false,
        forkid: null,
        hashGenesisBlock: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        isBitcoin: true,
        label: "Bitcoin",
        maxAddressLength: 34,
        maxFee: 2000,
        maxFeeSatoshiKb: 2000000,
        minAddressLength: 27,
        minFee: 1,
        minFeeSatoshiKb: 1000,
        name: "Bitcoin",
        network: Object { messagePrefix: "Bitcoin Signed Message:\n", bech32: "bc", pubKeyHash: 0, … },
        segwit: true,
        shortcut: "BTC",
        slip44: 0,
        support: Object { connect: true, trezor1: "1.5.2", trezor2: "2.0.5", … },
        type: "bitcoin",
        xPubMagic: 76067358,
        xPubMagicSegwit: 77429938,
        xPubMagicSegwitNative: 78792518,
    }
}
```
