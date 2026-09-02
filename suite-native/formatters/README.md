# @suite-native/formatters

React component wrappers around the shared `@suite-common/formatters` primitives, used to render amounts consistently across the mobile app.

## Coin and token formatters are split on purpose

Crypto (coin) amounts and token amounts are formatted by **separate** components. This is a deliberate design decision, enforced by the type system — it is not an accident that there is no single "amount formatter".

| Component                      | For          | Symbol prop                | Value                |
| ------------------------------ | ------------ | -------------------------- | -------------------- |
| `CompactCryptoAmountFormatter` | network coin | `symbol: NetworkSymbol`    | amount string        |
| `ExactCryptoAmountFormatter`   | network coin | `symbol: NetworkSymbol`    | amount string        |
| `CompactTokenAmountFormatter`  | token        | `tokenSymbol: TokenSymbol` | `DecimalTokenAmount` |
| `ExactTokenAmountFormatter`    | token        | `tokenSymbol: TokenSymbol` | `DecimalTokenAmount` |

### Why the split

- **Type safety.** The crypto formatters accept only a `NetworkSymbol`. Passing a token symbol is a compile error, which forces you to reach for a token formatter instead. This prevents tokens from silently falling through the coin path and losing token-specific formatting (e.g. stablecoin money-like rendering, which needs the token's decimals).
- **Token decimals.** Only the token formatters carry token decimals. `CompactTokenAmountFormatter` uses `tokenDecimals` to pick money-like rendering for 6-decimal stablecoins (USDC/USDT). Coin formatters have no notion of token decimals.
- **Decimal-unit invariant.** Token formatters accept only `DecimalTokenAmount` (human-readable units, not base units). Convert at the call site:
    - `asDecimalTokenAmount(value)` — value is already in decimal units.
    - `convertTokenValueToDecimal(value, decimals)` — value is in base units (subunits).

### Compact vs. exact

- **Compact** — use when the amount is shown next to a fiat value (balances, lists). Rounds, applies money-like formatting for stablecoins, abbreviates large amounts (M/B), and shows a dust threshold.
- **Exact** — use when there is no nearby fiat value or precision matters (send, receive, review, fees, transaction detail). Truncates instead of rounding; precision is capped by `maxDisplayedDecimals`.

## Usage

See `@suite-common/formatters` for the underlying `useFormatters()` / `makeFormatter` primitives that these components build on.
