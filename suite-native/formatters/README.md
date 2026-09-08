# @suite-native/formatters

React component wrappers around the shared `@suite-common/formatters` primitives, used to render amounts consistently across the mobile app.

## Choosing a formatter

Use `CryptoAmountFormatter` for network coin and token amounts. It renders a token amount when
`tokenContract` is present. Token-only calls without a network `symbol` also render through the token
path when token metadata is provided.

| Component               | For        | Symbol prop                               | Value         |
| ----------------------- | ---------- | ----------------------------------------- | ------------- |
| `CryptoAmountFormatter` | coin/token | `symbol` or `tokenSymbol`/`tokenContract` | amount string |

### Why token metadata still matters

- **Token detection.** `CryptoAmountFormatter` renders token amounts when `tokenContract` is present, or when token metadata (`tokenSymbol` or `tokenDecimals`) is provided without a network `symbol`. Otherwise it renders a network coin amount for `symbol`.
- **Token decimals.** Pass `tokenDecimals` so compact formatting can render 6-decimal stablecoins (USDC/USDT) money-like.
- **Decimal-unit invariant.** Token values are expected in human-readable units, not base units. Use `convertTokenValueToDecimal(value, decimals)` when the source value is in base units.

### Compact vs. exact

- **Compact** — use when the amount is shown next to a fiat value (balances, lists). Rounds, applies money-like formatting for stablecoins, abbreviates large amounts (M/B), and shows a dust threshold.
- **Exact** — use when there is no nearby fiat value or precision matters (send, receive, review, fees, transaction detail). Truncates instead of rounding; precision is capped by `maxDisplayedDecimals`.

## Usage

See `@suite-common/formatters` for the underlying `useFormatters()` / `makeFormatter` primitives that this component builds on.
