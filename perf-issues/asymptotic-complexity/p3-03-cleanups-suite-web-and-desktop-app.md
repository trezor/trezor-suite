# P3 complexity cleanups — Suite web and desktop app

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx:193`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx#L193) (also 79) — `TransactionTarget`

[`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L105) (also 93,95,121) — `AccountsList`

[`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:165`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L165) (also 168,163) — `prepareContent`

[`packages/suite/src/utils/wallet/tokenUtils.ts:27`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/tokenUtils.ts#L27) — `CoinsTable`

[`packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:147`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx#L147) (also 156) — `AssetsView`

[`packages/suite/src/views/wallet/transactions/TransactionList/TransactionsGroup/TransactionsGroup.tsx:52`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionsGroup/TransactionsGroup.tsx#L52) — `TransactionsGroup`

`suiteSyncOutputLabels` is selectSuiteSyncOutputLabels -> selectAllOutputsForWallet, i.e. EVERY output label stored for the whole wallet across all of its accounts, not just the ones on screen.

## Before

### `TransactionTarget` — `TransactionTarget.tsx:193`

```tsx
            return exhaustive(type);
    }
}, [accountKey, type, transaction, payload]);

const outputLabel =
    suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)
        ?.label ?? (isLegacyLabelingVisible ? targetMetadata : undefined);

return (
    <TransactionTargetLayout
        {...baseLayoutProps}
```

### `AccountsList` — `AccountsList.tsx:105`

```tsx
        ? accountLegacyLabels[key]
        : getDefaultAccountLabel(translationString, account)) ??
    '';

const { shownWithBalance } = getTokens({
    tokens: account.tokens ?? [],
    symbol: account.symbol,
    tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
});

// Mirror the account type badge, which is hidden for normal accounts.
```

### `prepareContent` — `exportTransactionsUtils.ts:165`

```ts
)
.map(formatAmounts(symbol))
.flatMap(t => {
    const sharedData = {
        date: new Intl.DateTimeFormat('default', dateFormat).format(
            (t.blockTime || 0) * 1000,
        ),
        time: new Intl.DateTimeFormat('default', timeFormat).format(
            (t.blockTime || 0) * 1000,
        ),
        timestamp: t.blockTime?.toString() || '',
```

### `CoinsTable` — `tokenUtils.ts:27`

```ts
// sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const balanceSort =
        // Sort by balance multiplied by USD rate
        b.fiatValue.minus(a.fiatValue).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.fiatRate?.rate || -1) - (a.fiatRate?.rate || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '', undefined, { sensitivity: 'base' });
```

### `AssetsView` — `AssetsView.tsx:147`

```tsx
    return allTokens;
}, []);

const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

return {
    network,
    failed: !!assetFailed,
    assetNativeCryptoBalance: assetNativeCryptoBalance
        ? assetNativeCryptoBalance
```

### `TransactionsGroup` — `TransactionsGroup.tsx:52`

```tsx
    transactions,
    baseCurrencyCode,
    historicFiatRates,
);
const erc4626Contracts = getErc4626Contracts(account.tokens);
const isMissingFiatRates = transactions.some(tx => {
    const fiatRateKey = getFiatRateKey(tx.symbol, baseCurrencyCode);
    const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
    const historicCryptoRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

    const isMissingTokenRate = tx.tokens
```

## After

### `TransactionTarget`

Add a memoized selector that keys the wallet's output labels by `${txId}:${txTargetId}` into a Map (next to selectSuiteSyncOutputLabelsByAccount) and have the row do a single Map lookup, instead of handing every row the whole array to scan.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `AccountsList`

Hoist the search-independent derivation above the filter and index it by account key:

const shownTokensByAccountKey = useMemo(() => {
const map = new Map<AccountKey, TokenInfo[]>();
accounts.forEach(account => {
map.set(account.key, getTokens({
tokens: account.tokens ?? [],
symbol: account.symbol,
tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
}).shownWithBalance);
});
return map;
}, [accounts, tokenDefinitions]);

then inside the filter use `shownTokensByAccountKey.get(key)`. Also wrap `filteredAccounts` itself in a `useMemo` keyed on [accounts, searchString, coinFilter, accountLegacyLabels, shownTokensByAccountKey], and skip the whole block when `searchString` is empty (only `coinFilter` is set), since `accountSearchFn` short-circuits on the symbol test alone in that case.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `prepareContent`

Hoist them to module scope next to the existing `dateFormat`/`timeFormat` constants: `const dateFormatter = new Intl.DateTimeFormat('default', dateFormat);` and `const timeFormatter = new Intl.DateTimeFormat('default', timeFormat);`, then call `dateFormatter.format(...)` / `timeFormatter.format(...)` inside the loop.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `CoinsTable`

Index once above the sort and compare plain numbers: precompute `const key = tokens.map(t => ({ t, fiat: t.fiatValue.toNumber(), rate: t.fiatRate?.rate ?? -1, sym: (t.symbol ?? '').toLowerCase() }))`, then compare `b.fiat - a.fiat || b.rate - a.rate || a.sym.length - b.sym.length || (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0)`. If real locale-aware ordering is required, hoist a single module-level `const collator = new Intl.Collator(undefined, { sensitivity: 'base' })` and call `collator.compare(...)` instead of `String.prototype.localeCompare` with an inline options object.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `AssetsView`

Use the index that already exists: `const symbolAccounts = assets[symbol] ?? []` and derive both values from it — `failed: symbolAccounts.some(a => a.failed)` and `stakingAccounts: symbolAccounts.filter(isSupported...)`. That makes the whole map O(accounts) total, and gives each row a symbol-scoped array so `selectAnyAccountIsStakingActive` scans only that network's transactions. Better still, replace it with the per-account `selectAccountIsStakingActive(state, account.key)` (same file, line 276), which is memoized on a stable primitive key and never misses.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `TransactionsGroup`

Hoist it: compute `const erc4626Contracts = useMemo(() => getErc4626Contracts(account.tokens), [account.tokens])` in `TransactionGroupedList` (or in `TransactionList`) and pass it down as a prop, so it is built once per account instead of once per day group.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(visibleTargets x walletOutputLabels) string comparisons per transaction-list render`** — hot path.

TransactionTarget is the row component rendered once per output by TransactionTargetsList.tsx:24, itself inside the per-transaction map of the transaction list, so the full unfiltered label list is re-scanned linearly for every visible target (25 transactions x their outputs per page). The label collection grows with user labeling and with Suite Sync syncing labels from other devices; the selector deliberately returns the unfiltered wallet-wide array (suiteSyncOutputSelectors.ts:60-67), so it is not bounded by the account being viewed.

**`O(n) loop-invariant string allocations, 3 throwaway strings per token where 1 per call suffices; n = account.tokens including the unfiltered spam tail`** — hot path.

The whole `filteredAccounts` expression sits in the render body (line 93, after the early return at 89) with no `useMemo`. Per account it runs `getTokens` (suite-common/wallet-core/src/tokens/tokenUtils.ts:33) which allocates 2 Sets, 6 result arrays, one intermediate `filteredTokens` array and one `new BigNumber(token.balance || '0')` per token; then `accountSearchFn` (suite-common/wallet-utils/src/accountUtils.ts:813) which `.find()`s over used + unused + change with a `u.address.toLowerCase()` allocation per address visited. Decisively, `getTokens` is called here WITHOUT `searchQuery`, so `shownWithBalance` does not depend on the search string at all -- yet it is recomputed for every account on every keystroke (`searchString` comes from the `useAccountSearch` context) and on every re-render caused by an account update. The sidebar is mounted on every wallet route, and `accounts` changes identity on each blockchain sync tick, so the recompute fires far more often than the user types. Note `accountSearchFn` returns `true` at :840 when `searchString` is empty, so with only a coin filter active the entire `getTokens` pass over every account's tokens is pure waste.

**`O(n) Intl.DateTimeFormat constructions of two loop-invariant formatters; n = exported transactions`** — cold path.

`exportTransactionsThunk` (packages/suite/src/actions/wallet/exportTransactionsActions.ts:79) feeds `getAccountTransactions(account.key, allTransactions)` in full, and `prepareContent` is called twice per export for PDF (once for `preparePdf`, and `prepareCsv` for CSV). Both format objects are loop-invariant -- they depend only on the module constants `dateFormat`/`timeFormat` -- yet two are constructed inside the `flatMap` for every transaction. Intl.DateTimeFormat construction is one of the most expensive allocations in the platform; at 50k transactions that is 100k constructions of the same two objects, blocking the main thread for seconds during export.

**`O(n log n) comparisons, each allocating a BigNumber and, on the zero-balance tail, negotiating an Intl collator`** — hot path.

The comparator `sortTokensWithRates` (packages/suite/src/utils/wallet/tokenUtils.ts:24) is not O(1) field reads: line 27 does `b.fiatValue.minus(a.fiatValue).toNumber()`, allocating a fresh BigNumber on every comparison, and line 33 falls through to `(a.symbol||'').localeCompare(b.symbol||'', undefined, { sensitivity: 'base' })` — passing an options object defeats V8's default-collator fast path, so a collator is negotiated per comparison. The fall-through fires for the whole zero-balance tail (equal fiatValue, both rates missing, equal symbol length), which on a spam-heavy account is most of the list. For n=1000 that is ~10k BigNumber allocations plus thousands of collation calls, inside a `useMemo` that re-runs whenever `fiatRates` changes. The same comparator is applied to the same class of data at DefiTokensTable.tsx:45, assetsViewUtils.ts:39, TokenIconSetWrapper.tsx:60 and both `useAccountWithTokensOptions` hooks.

**`O(networkSymbols x accounts) scans plus one accounts-sized array allocation per network row, per render`** — hot path.

Both scans sit inside `assetSymbols.map(...)` (line 126), which runs on every render of the unmemoized `AssetsView` body — and that re-renders on every fiat-rate tick (`useSelector(selectCurrentFiatRates)`) and every account update. Line 147 re-scans the whole account list per network even though the symbol->accounts index `assets` was just built at lines 110-122. Line 156 is worse: the predicate never reads `symbol`, so the identical result is recomputed and re-allocated once per network row. That fresh array then flows into `AssetRow.tsx:79` / `AssetCard.tsx:109`, which filters it again and feeds it as the memo key of `selectAnyAccountIsStakingActive` (suite-common/wallet-core/src/transactions/transactionsSelectors.ts:281). Because the array identity is new on every render, that weakMap-memoized selector always misses and re-runs `accountTransactions.filter(isClaimTx)` over the _entire_ transaction history of every staking account, once per asset row.

**`O(dayGroups x accountTokens) allocations per render instead of O(accountTokens)`** — hot path.

`TransactionGroupedList.tsx:35` renders one `TransactionsGroup` per day bucket of the current page, and the pending-tx list adds a second `TransactionGroupedList` on every page. With a 25-tx page of one-tx-per-day history that is ~25 groups, each recomputing the identical Set over the same `account.tokens`. The value is loop-invariant — it depends only on `account`, which is the same object for every group. `TransactionsGroup` is not memoized, so this reruns on every render of the transaction list. n grows with the account's token list (hundreds of dust/airdrop ERC-20s on a real EVM account).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- P3 is right and should not be inflated: the collection is user-created output labels synced across a wallet's devices — it grows with labeling activity but a heavy labeler reaches hundreds to low thousands, not the tens of thousands that transactions and UTXOs do, and lines 79-83 short-circuit to returnStableArrayIfEmpty when Suite Sync is disabled, so non-Suite-Sync users pay nothing. Frame it as an indexing/constant-factor cleanup, not a hang. The right fix is a Map keyed on the existing helper: suiteSyncOutputSelectors.ts already has createSuiteSyncOutputId(txId, txOutputId) and a memoized selectSuiteSyncOutputLabel doing the same `outputs.find(output => output.id === id)` per call — index once there and have both the row and that selector read the Map, otherwise the scan just moves. Preserve the `?? (isLegacyLabelingVisible ? targetMetadata : undefined)` fallback exactly; a Map.get miss must yield undefined, not null, or the `??` chain changes. For contrast, the legacy path on line 162 reads accountMetadata?.outputLabels[txid][targetId] as an object index and is already O(1) — the Suite Sync path is the odd one out.

- Spans more than one file — see also `suite-common/suite-sync/src/data/output/suiteSyncOutputSelectors.ts:60`.

- The hoist itself is trivial and safe: move the line above `filteredTokens.forEach` (i.e. after :56) and reference `query` in the callback — identical semantics because `searchQuery` is a parameter and is never reassigned. REJECT the second half of the proposed fix as written: removing `const search = rawSearch.toLowerCase();` from suite-common/wallet-utils/src/tokenUtils.ts:102 is a behaviour change, because getTokens is not the only caller — packages/suite/src/components/suite/asset-picker/hooks/useFilterAccountsWithTokens.ts:57,64,80,86,96 and .../TradingFormInputBuyAsset/AssetPickerModal/hooks/useBuildTradingAssetOptions.ts:235 pass their own `search` and were not verified to pre-lowercase it. Either audit and normalise all of those first, or leave :102 alone and only do the hoist. Same latent issue in `isNftMatchesSearch`. Low value on its own — best folded into whichever change touches getTokens next rather than filed as a standalone issue.

- Spans more than one file — see also `suite-common/wallet-core/src/tokens/tokenUtils.ts:33`.

- Cold path — user-initiated export only, runs once per click, so this is a hygiene fix, not a user-visible regression. The sweeper's 'twice per export for PDF' claim is wrong in detail: line 353 and line 400 are two DIFFERENT exporters (CSV vs PDF), each calling prepareContent once, not one export calling it twice. Also temper the impact claim: V8/JSC cache the underlying ICU formatter for identical (locale, options) pairs, so the saving is the JS wrapper allocation and option normalisation, not a full ICU build each time. Still a real per-row cost and a two-line fix. Fix is trivially safe: hoist `const dateFormatter = new Intl.DateTimeFormat('default', dateFormat)` / `timeFormatter` to module scope beside the existing constants. One caveat to note: module-scope construction pins the locale at module-load time, which is already the current behaviour in practice ('default' resolves to the system locale, and this file does not react to in-app locale changes) — but if Suite ever wires export formatting to the app language setting, the formatter must be built inside `prepareContent` (once, above the loop) rather than at module scope.

- Prefer the MINIMAL in-place fix over the candidate's decorate-sort-undecorate rewrite: `b.fiatValue.comparedTo(a.fiatValue) ||` returns a plain number without allocating an intermediate BigNumber, and hoisting `const symbolCollator = new Intl.Collator(undefined, { sensitivity: 'base' })` to module scope and calling `symbolCollator.compare(a.symbol || '', b.symbol || '')` removes the per-comparison collator negotiation. Both are drop-in and require no changes at the 8 call sites; the candidate's precompute-keys approach would force edits at all 8. Semantic check on comparedTo: it returns `null` when either operand is NaN, where `minus().toNumber()` returns NaN — both are falsy so the `||` chain falls through identically, but TypeScript types comparedTo as `number | null`, so the `||` chain still type-checks while the function's inferred return type stays `number` only because the final localeCompare term is `number` — verify tsc is happy rather than assuming. Also note `.sort()` here mutates the array returned by `enhanceTokensWithRates`, which is freshly allocated by its internal `.map()`, so no shared-array mutation hazard at any call site.

- Spans more than one file — see also `packages/suite/src/utils/wallet/tokenUtils.ts:24`.

- The real payoff is not the scan count, it is killing the per-render array identity churn that defeats AssetRow's `memo` and the weakMapMemoize on selectAnyAccountIsStakingActive (transactionsSelectors.ts:281). CRITICAL COMPANION EDIT: fixing AssetsView alone does NOT restore the memo — AssetRow.tsx:79 and AssetCard.tsx (same pattern, selector call at line 113) each do their own `.filter()` on the prop before passing it to the selector, producing a fresh array every render regardless. Both need the same treatment. The cleanest fix is the one the candidate lists last: swap to the per-account `selectAccountIsStakingActive(state, account.key)` (transactionsSelectors.ts:276), memoized on a stable primitive. For line 147, `assets[symbol]?.some(a => a.failed)` is equivalent to the current `!!accounts.find(f => f.symbol === network.symbol && f.failed)` since `assets[symbol]` is exactly the accounts with that symbol; `?? false` needed for noUncheckedIndexedAccess. Same file also has a `return [...acc, {...}]` reduce at line 86 (useAssetsFiatBalances) — genuine Rule-3 shape but n = network rows, so not worth filing.

- Spans more than one file — see also `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:83`.

- The group multiplier is bounded by the page size (one group per distinct day among the txs on the current page, so <= TXS_PER_PAGE, ~25), plus a second TransactionGroupedList for the pending list. So this is a bounded ~25x constant factor on an unbounded token list, not quadratic growth — file it as a cheap hoist, not as an algorithmic bug. Fix: compute it once in TransactionGroupedList (or TransactionList) with `useMemo(() => getErc4626Contracts(account.tokens), [account.tokens])` and pass it down as a prop; `getErc4626Contracts` returns `Set<string>` so the prop type is `Set<string>`. Note the Set is only consumed inside the `isMissingFiatRates` predicate a few lines below (line ~59, `!erc4626Contracts.has(token.contract.toLowerCase())`), so nothing else in the component needs touching, and `getErc4626Contracts` becomes an unused import in TransactionsGroup.tsx after the move.

- Spans more than one file — see also `packages/suite/src/views/wallet/transactions/TransactionList/TransactionGroupedList.tsx:36`.

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
