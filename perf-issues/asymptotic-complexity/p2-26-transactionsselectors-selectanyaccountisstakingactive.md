# `selectAnyAccountIsStakingActive` takes an array argument, so its memo never holds — key it on the network symbol

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`suite-common/wallet-core/src/transactions/transactionsSelectors.ts:281`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsSelectors.ts#L281) (also 281, 285, 286) — `selectAnyAccountIsStakingActive`

`transactions[account.key]` = the full transaction history of each staking account; the outer multiplier is the number of dashboard asset rows

## Before

```ts
    [selectAccountClaimTransactions, selectAccountByKey],
    (claimTransactions, account) => isAccountStakingActive(account, claimTransactions),
);

export const selectAnyAccountIsStakingActive = createMemoizedSelector(
    [selectTransactions, (_: TransactionsRootState, accounts: Account[]) => accounts],
    (transactions, accounts) =>
        accounts.some(account => {
            const accountTransactions = transactions[account.key] ?? [];
            const claimTransactions = accountTransactions.filter(tx =>
                isClaimTx(tx?.ethereumSpecific?.parsedData?.methodId),
```

## After

Take a stable primitive instead of an array so the memo can actually hold: change the signature to `(state, symbol: NetworkSymbol)` and derive the staking accounts inside from the already-memoized `selectAccounts`/`selectDeviceAccountsByNetworkSymbol`, e.g.

export const selectAnyAccountIsStakingActive = createMemoizedSelector(
[selectTransactions, selectDeviceAccountsByNetworkSymbol],
(transactions, accounts) => accounts.some(account => { ... }),
);

Also replace the `filter(...)` + `isAccountStakingActive` pair with a single `some(...)` so no intermediate array is allocated, and hoist the symbol-independent `accounts.filter(...)` in AssetsView.tsx out of the `assetSymbols.map`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`Per dashboard render: O(sum of loaded transactions across the staking accounts of each rendered symbol) + one intermediate array allocation per row; the weakMap memo never hits because the `Account[]` argument is rebuilt inline in the render body`** — hot path.

The selector's second parameter is an `Account[]`, and `createWeakMapSelector` (redux-utils/selectorsUtils.ts:24-27) keys its `argsMemoize`/`memoize` on argument _identity_. Both callers build that array inline in the render body — `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:79` (`stakingAccounts.filter(...)`) and `AssetCard.tsx:109` — so every render produces a fresh reference, the WeakMap misses, and the combiner re-filters each staking account's _entire_ transaction list (allocating a new array) to answer a boolean. The dashboard re-renders on every fiat-rate chunk (fetched 4 tickers at a time by `fetchFiatRatesThunk`) and on every account update from the sync loop, so a user with a 5k-tx ETH account pays a 5k-element filter per asset row per render. Upstream makes it worse: `AssetsView.tsx:156` computes `stakingAccounts: accounts.filter(...)` _inside_ the `assetSymbols.map(...)`, with a predicate that does not even depend on the mapped symbol — a loop-invariant O(accounts) scan repeated once per asset.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- BEHAVIOUR CAVEATS on the proposed fix. (1) `filter` -> `some` is NOT a drop-in: `isAccountStakingActive` (suite-common/wallet-core/src/stake/stakeUtils.ts:10-38) takes `claimTransactions: WalletAccountTransaction[]` and uses it only as `claimTransactions.filter(isPending).length > 0`, so collapsing it needs a signature change on a helper that is also used by `selectAccountIsStakingActive` (line 278) - do it as `some(tx => isClaimTx(...) && isPending(tx))` and pass a boolean, or leave the helper alone and just hoist. (2) Changing the parameter to `NetworkSymbol` + `selectDeviceAccountsByNetworkSymbol` widens the input from 'staking-capable accounts' to 'all device accounts of that symbol'; that is safe only because `isAccountStakingActive` returns false for `!isSupportedStakingNetworkSymbol`, but it does add a full-history filter for non-staking accounts unless the `some`/early-exit rewrite lands with it. (3) Companion edit outside wallet-core: packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:155-160 computes `stakingAccounts: accounts.filter(...)` INSIDE the `assetSymbols.map(...)` with a predicate that does not reference the mapped symbol - a genuinely loop-invariant O(accounts) scan repeated per asset, worth hoisting in the same PR. (4) Cheapest standalone win with zero API change: memoize `stakingAccountsForAsset` with useMemo in AssetRow/AssetCard so the weakMap key stabilises.

- Spans more than one file — see also `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:79`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
