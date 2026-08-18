# `TokenIconSetWrapper` is handed every account's tokens for every network row — pass the row's own accounts

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:26`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TokenIconSetWrapper.tsx#L26) (also 32,60) — `TokenIconSetWrapper`

`accounts` is every visible account of the selected device across every enabled network, and the inner work is over each account's full ERC-20/SPL token array. n = sum of tokens over all accounts (ERC-20 dust/airdrop lists routinely reach several hundred per EVM account).

## Before

```tsx
const baseCurrencyCode = useSelector(selectBaseCurrency);
const fiatRates = useSelector(selectCurrentFiatRates);
const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

const allTokensWithRates = accounts.flatMap(account =>
    enhanceTokensWithRates(account.tokens, baseCurrencyCode, symbol, fiatRates),
);

if (!allTokensWithRates.length) return null;

const tokens = getTokens<TokensWithRates>({
```

## After

Pass only the row's own accounts. `AssetsView` already builds the index — `assets: PartialRecord<NetworkSymbol, Account[]>` at lines 110-122 — so thread `assets[symbol]` through `AssetData.accounts` instead of the global `accounts`, i.e. in AssetsView.tsx:162 use `accounts: assets[symbol] ?? []`. Nothing downstream wants the cross-network accounts: `TokenIconSetWrapper` only ever emits tokens whose contract is known to `coinDefinitions` for `symbol`. Optionally also wrap the flatMap/getTokens/sort chain in a `useMemo` keyed on `[accounts, symbol, baseCurrencyCode, fiatRates, coinDefinitions]` since packages/suite is not React-Compiler-compiled.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(tokenRows x totalTokensAcrossAllAccounts) instead of O(tokensOfThatNetwork), plus 2 BigNumber allocations per token per row`** — hot path.

The component is rendered once per _network row_ of the dashboard's My Assets section, but is handed the whole unfiltered account list. `AssetRow.tsx:230` renders `<TokenIconSetWrapper accounts={accounts} symbol={network.symbol} />` where `accounts` is `asset.accounts` === the full `selectAllAccountsToList` result (AssetsView.tsx:162), not the accounts of that row's network. `AssetCardTokensAndStakingInfo.tsx:61` does the same for the grid layout. So an ETH account with 800 tokens is re-scanned for the BTC row, the SOL row, the ADA row... For each row this does 2 BigNumber allocations per token in `enhanceTokensWithRates`, then a third in `getTokens` (line 32), then a full sort (line 60) — all on tokens that will be discarded because they do not match the row's `coinDefinitions`. Entry point: dashboard `AssetsView`, whose body is entirely unmemoized and re-runs on every fiat-rate tick and account update; `AssetRow` is `memo`ed but its `assetsFiatBalances` prop is rebuilt fresh every render (AssetsView.tsx:78-90), so the memo never holds.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- The row multiplier is itself bounded (one per enabled network that renders a token row, ~5-10 in practice), so this is a large constant factor on an unbounded n rather than true quadratic growth — grade accordingly, but the wasted portion is 100% pure waste. Fix as proposed: AssetsView.tsx already builds `assets: PartialRecord<NetworkSymbol, Account[]>` at lines 110-122, so change line 162 from `accounts,` to `accounts: assets[symbol] ?? []`. Behaviour delta is nil in practice (getTokens already drops tokens not in the row's coinDefinitions) but it is not a pure no-op: today a foreign-network contract that happened to appear in this symbol's coinDefinitions would leak into the icon set. `AssetData.accounts` is typed `Account[]` (AssetData.ts) so `assets[symbol] ?? []` needs the `?? []` for noUncheckedIndexedAccess. Companion consideration: AssetRow is `memo`ed but never actually memoizes, because `stakingAccounts` and `assetsFiatBalances` are rebuilt fresh each render (see candidate 3) — fixing only this file does not stop the re-renders. packages/suite is not React-Compiler-compiled, so a useMemo around the flatMap/getTokens/sort chain is a legitimate extra step.

- Spans more than one file — see also `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:230`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
