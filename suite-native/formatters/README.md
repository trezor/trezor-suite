# @suite-native/formatters

React component wrappers around the shared `@suite-common/formatters` primitives, used to render
amounts consistently across the mobile app.

## Crypto and token amounts

Use the formatter that matches the value's domain:

- `CryptoAmountFormatter` formats a network's native coin. It requires a network `symbol` and accepts
  a `string`, `number`, or `null` value.
- `TokenAmountFormatter` formats a token. It requires a `DecimalTokenAmount`; its `symbol` and native
  `decimals` are optional display metadata. Token values are always expected in human-readable units.
  Use `convertTokenValueToDecimal` when a source value is in base units.

For network amounts, `valueUnit` states what the value represents. It defaults to `main`; pass
`valueUnit="smallest"` for values such as wei or satoshis that the formatter must convert.

### Compact vs. exact

- **Exact** is the default. Use it when there is no nearby fiat value or precision matters, such as
  send, receive, review, fee, and transaction-detail screens. It truncates instead of rounding and
  respects `maxDisplayedDecimals`.
- **Compact** is for amounts shown next to a fiat value, such as balances and lists. Set
  `formatStyle="compact-balance"` explicitly. It rounds, abbreviates large values, and shows a dust
  threshold. Pass a token's native `decimals` so six-decimal stablecoins can use money-like
  formatting.

## Examples

```tsx
<CryptoAmountFormatter value={account.formattedBalance} symbol={account.symbol} />

<CryptoAmountFormatter
    value={feeInWei}
    symbol={account.symbol}
    valueUnit="smallest"
/>

<TokenAmountFormatter
    value={convertTokenValueToDecimal(token.balance, token.decimals)}
    symbol={token.symbol}
    decimals={token.decimals}
    formatStyle="compact-balance"
/>
```

See `@suite-common/formatters` for the underlying `useFormatters()` and `makeFormatter` primitives.
