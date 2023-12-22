# Fiat rates

Suite provides several types of fiat rates:

-   Current fiat rate: Used on Dashboard, next to the account balance, for converting a crypto amount in send form to a fiat currency, etc...
-   Weekly rates: In addition to current rate we also fetch 7 days old rate and based on the difference we either show green or red arrow next to an exchange rate (can be seen in assets table on Dashboard).
-   Historical fiat rate: Exchange rate at the time of facilitating a transaction. Used in list of transactions to calculate daily deltas and in transaction detail modal. ERC-20 tokens are not yet implemented.

## Providers

-   Blockbook: For all main networks (BTC, LTC, ETH + ERC-20 tokens, ...) except XRP, SOL + SOL tokens and ADA + ADA tokens
-   CoinGecko: Used for XRP, SOL + SOL tokens and ADA + ADA tokens and as a fallback for failed requests to blockbook.

## First fetch

### Current fiat rates

For main networks: On app launch for enabled networks and then immediately after enabling new coin/network

#### Current fiat rates for ERC-20 tokens

ERC-20 tokens: On `ACCOUNT.CREATE` which is triggered during account discovery (if account were not remembered), on `ACCOUNT.UPDATE` when `account.tokens` has some new items.

### Weekly fiat rates

Weekly rates are downloaded on app launch and on enabling new network.

### Historical fiat rates (for transactions)

Historical rates for transactions: On `addTransaction` action, which means after a new transaction is added, stored within the tx object,

## Update intervals

### Current fiat rates

Every rate stored in `wallet.fiat` reducer is checked in 2-minute interval. If the rate is older then 10 minutes then it is refetched. Although this shouldn't really be necessary thanks to live updates from Blockbook, the same logic is also used for ERC-20 tokens and XRP where we don't have a comfort of receiving these updates and we are relying on manual checks.

#### Current fiat rates for ERC-20 tokens

List of tokens is part of the account object (`account.tokens`).
Fiat rates for ERC-20 tokens are fetched on `ACCOUNT.CREATE` (fired during account discovery) and `ACCOUNT.UPDATE` (new token can appear after receiving a token transaction). These actions are intercepted in `fiatRatesMiddleware`.

### Weekly fiat rates

Check for deciding if a weekly rate for a coin needs to be updated runs every hour. Fetched rates are cached also for 1 hour. Eg. If user opens app and there are already weekly fiat rates, no older than 1 hour, stored in persistent storage then Suite won't fire new fetch. If, after one hour, fetch fails then next one will be fired after another hour.

### Historical fiat rates (for transactions)

They are stored as part of the transaction. They don't need to be periodically updated as the exchange rate in the past cannot change anymore. If fetch fails for some reason we will retry on next `BLOCKCHAIN.CONNECTED`.

## Usage

To make your life easier use [FiatValue](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/FiatValue/index.tsx) component.

Most straightforward usage is to just pass `amount` and `symbol`, if you need to work with tokens also add `tokenAddress` property:

```jsx
<FiatValue amount={amount} symbol={assetSymbol} tokenAddress={tokenTransfer?.address} />
```

For converting to fiat amount using rates from custom source use `useCustomSource` in combination with `source` property:

```jsx
<FiatValue
    amount={targetAmount}
    symbol={transaction.symbol}
    source={transaction.rates}
    useCustomSource
/>
```

To support more complex use-cases we are leveraging render props.
When passing function as a children it will get called with one parameter, object with `value`, `rate` and `timestamp`. This allows us to handle cases where fiat rates are missing (all fields in the object are set `null`) or show not only fiat amount, but also used exchange rate.

```jsx
<FiatValue amount="1" symbol={symbol}>
    {({ _value, rate, timestamp }) =>
        rate && timestamp ? (
            // we got rates!
            // show the exchange rate and provide information about last update in tooltip
            <Tooltip
                content={
                    <LastUpdate>
                        <Translation
                            id="TR_LAST_UPDATE"
                            values={{
                                value: (
                                    <FormattedRelativeTime
                                        value={rateAge(timestamp) * 60}
                                        numeric="auto"
                                        updateIntervalInSeconds={10}
                                    />
                                ),
                            }}
                        />
                    </LastUpdate>
                }
            >
                <FiatRateWrapper>{rate}</FiatRateWrapper>
            </Tooltip>
        ) : (
            // no rates available!
            <NoRatesTooltip />
        )
    }
</FiatValue>
```

There are other handy props like `showApproximationIndicator` (self explanatory) and `disableHiddenPlaceholder` which disables blurred overlay used when discreet-mode is activated.
