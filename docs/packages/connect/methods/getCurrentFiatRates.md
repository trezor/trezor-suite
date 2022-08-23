## Get current fiat rates

Retrieves current selected exchange rates for selected coin.

```javascript
const result = await TrezorConnect.blockchainGetCurrentFiatRates(params);
```

### Params

```javascript
{
    currencies: ['currency1','currency2','currency3',...],
    coin: 'coin'
}
```

### Example

Return current EUR, USD, BTC exchange rates for ETH:

```javascript
const result = await TrezorConnect.blockchainGetCurrentFiatRates({
    currencies: ['EUR', 'CZK', 'BTC'],
    coin: 'ETH',
});
```

### Result

[GetCurrentFiatRates type](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/types/responses.ts)

```javascript
{
    success: true,
    payload: {
        rates: {btc: 0.07461017, eur: 1768.36, usd: 1802.17},
        ts: 1659962048
    }
}
```
