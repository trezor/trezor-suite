# P3 complexity cleanups — suite-native mobile app

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx#L33) (also 33) — `AccountsListTokenItem`

[`suite-native/module-activity-center/src/components/notifications/TransactionNotificationItem.tsx:85`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-activity-center/src/components/notifications/TransactionNotificationItem.tsx#L85) (also 84) — `TransactionNotificationItem`

[`suite-native/module-earn/src/components/EarnDepositsCardRow.tsx:40`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/components/EarnDepositsCardRow.tsx#L40) (also 43,47) — `getVisibleRowIcons`

[`suite-native/module-send/src/screens/SendUtxoScreen.tsx:88`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/screens/SendUtxoScreen.tsx#L88) (also 87) — `onSelectionSubmit`

[`suite-native/module-trading/src/components/general/MyAssetSheet/MyAssetSheet.tsx:95`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/components/general/MyAssetSheet/MyAssetSheet.tsx#L95) (also 96) — `MyAssetSheet renderSectionHeader`

[`suite-native/module-trading/src/hooks/general/useMyAssetsFilteredData.ts:40`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useMyAssetsFilteredData.ts#L40) (also 15,27,28,41,44) — `sortSectionItemsCallback / getSortWeight / filterCallback`

[`suite-native/tokens/src/tokensSelectors.ts:47`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/tokens/src/tokensSelectors.ts#L47) (also 49) — `selectAccountTokenInfo`

[`suite-native/transactions/src/components/TransactionListItemContainer.tsx:134`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionListItemContainer.tsx#L134) (also 133) — `TransactionListItemContainer`

`account.tokens` — the token list of one EVM/Solana/Stellar account, which grows with every token (including spam airdrops) the account has ever been credited with.

## Before

### `AccountsListTokenItem` — `AccountsListTokenItem.tsx:33`

```tsx
    isFirst,
    isLast,
    showFiatValue = true,
}: AccountListTokenItemProps) => {
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, account.key, token.contract),
    );
    const balance = token.balance ?? '0';

    return (
        <AccountsListItemBase
```

### `TransactionNotificationItem` — `TransactionNotificationItem.tsx:85`

```tsx
const { type, descriptor, symbol, txid, formattedAmount, tokenContract } =
    getTxNotificationFields(notification);

const account = useSelector((state: AccountsRootState & DeviceRootState) =>
    selectDeviceAccountByDescriptorAndNetworkSymbol(state, descriptor, symbol),
);

const accountKey = account?.key;
const accountLabel = account?.accountLabel ?? `${descriptor.slice(0, 10)}…`;

const iconName = txTypeIconMap[type];
const contentColor = seen ? 'contentSecondary' : ('contentPrimary' as const);
```

### `getVisibleRowIcons` — `EarnDepositsCardRow.tsx:40`

```tsx
        ? `${rowItem.type}:${rowItem.symbol}`
        : `${rowItem.type}:${rowItem.networkSymbol}:${rowItem.tokenContractAddress}`;

const getVisibleRowIcons = (row: EarnDepositsCardRowType) =>
    row.activeItems.reduce<typeof row.activeItems>((uniqueItems, rowItem) => {
        const iconKey = getRowItemIconKey(rowItem);

        if (uniqueItems.some(existingItem => getRowItemIconKey(existingItem) === iconKey)) {
            return uniqueItems;
        }

        return [...uniqueItems, rowItem];
    }, []);

type EarnDepositsCardRowProps = {
    row: EarnDepositsCardRowType;
    onPress: () => void;
```

### `onSelectionSubmit` — `SendUtxoScreen.tsx:88`

```tsx
    [tempSelectedUtxos],
);

const onSelectionSubmit = () => {
    setSelectedUtxos(
        account?.utxo?.filter(u =>
            tempSelectedUtxos.some(tempUtxo => isSameUtxo(u, tempUtxo)),
        ) ?? [],
    );
    setTempSelectedUtxos([]);
    navigation.goBack();
};

const onSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
```

### `MyAssetSheet renderSectionHeader` — `MyAssetSheet.tsx:95`

```tsx
        onAssetSelect(selectedAsset, account);
        closeSheet();
    })
}
renderSectionHeader={(_label, config) => {
    const sectionIndex = filteredSections.findIndex(
        section => section.sectionData.key === config.sectionData.key,
    );

    return (
        <MyAssetListSectionHeader
            account={config.sectionData}
            isFirst={sectionIndex === 0}
        />
```

### `sortSectionItemsCallback / getSortWeight / filterCallback` — `useMyAssetsFilteredData.ts:40`

```ts
    return 6;
};

const sortSectionItemsCallback = (a: MyAssetRow, b: MyAssetRow, filterValue: string): number => {
    const query = normalizeForSearch(filterValue);

    return (
        getSortWeight(a as MyAssetTradeable, query) - getSortWeight(b as MyAssetTradeable, query)
    );
};

export const useMyAssetsFilteredData = (sections: SectionListData<MyAssetRow, Account>) => {
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);

    const sectionsForTextFilter = useMemo(() => {
        if (!filterSymbol) {
```

### `selectAccountTokenInfo` — `tokensSelectors.ts:47`

```ts
if (!account?.tokens) {
    return null;
}

const lowerCaseTokenAddress = tokenAddress?.toLowerCase();

const token = A.find(
    account.tokens,
    (t: TokenInfo) => t.contract.toLowerCase() === lowerCaseTokenAddress,
);

if (!token) {
    return null;
}

const symbol = shouldUppercaseTokenSymbol(token);
```

### `TransactionListItemContainer` — `TransactionListItemContainer.tsx:134`

```tsx
const hasIncludedCoins = includedCoinsCount > 0;
const includedCoinsLabel = `+${includedCoinsCount} coin${includedCoinsCount > 1 ? 's' : ''}`;

const { DateTimeFormatter } = useFormatters();
const transactionBlockTime = useSelector((state: TransactionsRootState) =>
    selectTransactionBlockTimeById(state, accountKey, txid),
);

const isTransactionPending = isPending(transaction);
const { isPhishing: isPhishingTransaction } = useSelector(
    (
        state: TokenDefinitionsRootState &
            TransactionsRootState &
```

## After

### `AccountsListTokenItem`

Drop the selector call and derive from the prop: the `token` prop is already `TokenInfoBranded`, so use `token.symbol` (applying `shouldUppercaseTokenSymbol` locally if the branding is not already applied upstream). If a lookup is genuinely needed elsewhere, change selectAccountTokenInfo to build one `Map<lowercasedContract, TokenInfo>` per account instead of re-scanning and re-lowercasing per call.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `TransactionNotificationItem`

Index once: add a memoised `selectDeviceAccountsByDescriptorAndSymbolMap` (Map keyed on `${symbol}:${descriptor}`) next to selectVisibleDeviceAccountsMap, and have the row do a single `map.get(key)`. Also consider virtualising NotificationList with FlashList so row count is viewport-bounded.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getVisibleRowIcons`

const getVisibleRowIcons = (row: EarnDepositsCardRowType) => {
const seen = new Set<string>();
const unique: typeof row.activeItems = [];
for (const item of row.activeItems) {
const iconKey = getRowItemIconKey(item);
if (seen.has(iconKey)) continue;
seen.add(iconKey);
unique.push(item);
if (unique.length === MAX_VISIBLE_ROW_ICONS) break;
}
return unique;
};

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `onSelectionSubmit`

const selectedOutpoints = new Set(tempSelectedUtxos.map(getUtxoOutpoint));
setSelectedUtxos(account?.utxo?.filter(u => selectedOutpoints.has(getUtxoOutpoint(u))) ?? []);

getUtxoOutpoint is already exported from @suite-common/wallet-utils. The same Set would also fix handleUtxoSelect at :65-71, which is O(m) per tap and O(m^2) across a select-many session.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `MyAssetSheet renderSectionHeader`

isFirst={filteredSections[0]?.sectionData.key === config.sectionData.key}

- one comparison instead of a scan. (Or hoist a `const firstSectionKey = filteredSections[0]?.sectionData.key` above the JSX.)

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `sortSectionItemsCallback / getSortWeight / filterCallback`

Do what the sibling hook useTradeableAssetsFilteredData.ts:85-90 already does: build `const searchFieldsByAsset = useMemo(() => new Map(rows.map(r => [r, {name: normalizeForSearch(r.name), symbol: normalizeForSearch(r.tokenSymbol ?? r.symbol)}])), [rows])`, normalize the query once outside the filter/sort, precompute a `weightByRow` Map in one pass, and make the comparator `weightByRow.get(a)! - weightByRow.get(b)!` - two Map reads, zero allocations.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectAccountTokenInfo`

Index the account's tokens once instead of scanning per row. Add a memoized-per-account map selector and read it in O(1): The early `if (!tokenAddress) return null;` alone removes the wasted full scan on every non-token row.

```ts
const selectTokensByLowerCaseContract = createMemoizedSelector(
    [selectAccountByKey],
    account =>
        new Map((account?.tokens ?? []).map(t => [t.contract.toLowerCase(), t])),
);

export const selectAccountTokenInfo = createMemoizedSelector(
    [selectTokensByLowerCaseContract, (_s, _k?: AccountKey, tokenAddress?: TokenAddress) => tokenAddress],
    (tokensByContract, tokenAddress) => {
        if (!tokenAddress) return null;
        const token = tokensByContract.get(tokenAddress.toLowerCase());
        ...
    },
);
```

### `TransactionListItemContainer`

Drop the selector entirely and read the prop:

const transactionBlockTime = transaction.blockTime ? transaction.blockTime * 1000 : null;

Same value, O(1), and it removes one useSelector subscription per row. (TransactionListItem.tsx:45 and TokenTransferListItem pass the identical store transaction down, so the prop is always the store object.)

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(renderedTokenRows x account.tokens) lowercase allocations per account update`** — hot path.

The row already receives the whole `token` object, yet it asks a selector to find that same token again by contract address. selectAccountTokenSymbol -> selectAccountTokenInfo (suite-native/tokens/src/tokensSelectors.ts:47) does `A.find(account.tokens, t => t.contract.toLowerCase() === lowerCaseTokenAddress)` — a linear scan that allocates a fresh lowercase string for every token it touches. ZeroBalanceTokensSection.tsx:72 maps ALL zero-balance tokens into these rows inside an accordion (not virtualized, so every row mounts at once), which is exactly where spam tokens pile up; ActiveTokensTab and DefiTokensTab feed the same row through FlashList, so a full scroll performs the same total work. Every account update (new block/balance change) invalidates the weakMap cache and the whole N x N pass runs again.

**`O(rendered notifications x selected-device accounts)`** — warm path.

The selector body is `accounts.find(a => a.descriptor === accountDescriptor && a.symbol === symbol)` over selectDeviceAccounts (suite-common/wallet-core/src/accounts/accountsSelectors.ts:276). Unlike every other list in this scope, the notification list is NOT virtualised: NotificationList.tsx:32 renders `notifications.map(...)` inside a plain Card/VStack, so all n rows mount and all n selectors run. n is not capped - the reducer does a bare `state.unshift(payload)` with no trimming (suite-common/toast-notifications/src/notificationsReducer.ts), and accountsThunks fans out one addEvent per newly discovered transaction (`analyze.newTransactions.forEach(...)`, suite-common/wallet-core/src/accounts/accountsThunks.ts:276), so a first sync after being offline can push hundreds of entries at once. selectDeviceAccounts returns a fresh array whenever the accounts slice changes - which is every sync tick - so all n memoised finds are invalidated together and the whole n*m sweep repeats. Entry point: Activity Center -> Notifications tab while a discovery/sync is running.

**`O(k^2) comparisons and O(k^2) array allocations, 2 template-string builds per comparison`** — warm path.

Two rule violations in six lines: `uniqueItems.some(...)` is a scan inside a reduce (and it recomputes getRowItemIconKey - a template string - for every element already accumulated, on every step), and `[...uniqueItems, rowItem]` copies the accumulator each iteration. k grows with the number of staking/yield accounts on the device (useStakingListData.ts builds one item per staking account, and the stablecoin-yield list one per account-vault pair), so it is not a fixed-size collection. Runs unmemoised in the render body of a React.memo component (:57) on the Earn dashboard. Magnitude is modest today - hence P3 - but the function is also wasteful in kind: only MAX_VISIBLE_ROW_ICONS = 3 icons are ever shown.

**`O(account UTXOs x selected UTXOs)`** — cold path.

Both collections are the account's UTXO set - the same growing collection the skill calls out - and m approaches n when the user selects most coins. isSameUtxo compares txid + vout, so an outpoint Set makes this O(n+m). A long-lived Bitcoin account that has received many small payments carries thousands of UTXOs. This is the coin-control confirm button (SendUtxoScreenFooter onSubmit at :114), so it is a one-shot user-initiated action rather than a render path - sizing accordingly. Distinct from the already-filed UtxoList.tsx:41.

**`O(rendered section headers x sections)`** — warm path.

A findIndex over the whole section list runs inside the per-header render callback, purely to compute the boolean `sectionIndex === 0`. n = accounts, which grows with the wallet (networks x account types x passphrase wallets) and is exactly the collection the skill treats as growing. The BottomSheetSectionList virtualises, so only visible headers pay - I am sizing this LOW for that reason - but the fix is a strict O(1) improvement with no downside.

**`O(n log n) comparisons x 5 String.normalize('NFD')+regex+toLowerCase+trim allocations each, per section, per keystroke; n = tradeable assets in one account's section`** — hot path.

useSectionDataFilter (suite-common/trading/src/hooks/useSectionDataFilter.ts:25) calls `data.sort((a, b) => sortSectionItemsCallback(a, b, filterValue))`, so the comparator body runs O(n log n) times. Each call does normalizeForSearch(filterValue) at :41 (loop-invariant - it is the same query for the whole sort) and getSortWeight then does two more at :27-28 for each of a and b. normalizeForSearch is `.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()` (suite-common/suite-utils/src/listFilterUtils.ts) - Unicode NFD normalisation is one of the most expensive string ops on Hermes. filterCallback has the same loop-invariant bug at :15 (query normalised once per item instead of once per filter) plus up to 4 field normalisations per item at :19-22. n = tokens held by one account, which grows with the account and is inflated by airdrop/spam tokens on EVM; the whole filter+sort re-runs on every keystroke in the MyAssetSheet search box (MyAssetSheet.tsx:68 -> MyAssetSheetHeader onFilterChange).

**`O(rows * |account.tokens|) with one string allocation per element examined, per account-object identity change`** — hot path.

This is the two-file shape: the list maps rows, and each ROW re-enters this selector with its own contract, so the selector scans the whole token array per row. `suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx:34` calls `selectAccountTokenSymbol(state, account.key, token.contract)`, and that component is rendered per row by `HiddenTokensTab.tsx:129` (whose data is `selectAccountUnrecognizedTokens` — precisely the unbounded spam list), `ActiveTokensTab.tsx:105`, `DefiTokensTab.tsx:53` and `ZeroBalanceTokensSection.tsx:73`. The same selector is also reached per transaction row through `suite-native/formatters/src/components/CoinAmountFormatter.tsx:34` and `CoinToFiatAmountFormatter.tsx:34`. The `createWeakMapSelector` result cache is keyed on `(account, tokenAddress)`, so it absorbs plain re-renders but every row recomputes as soon as the `account` object identity changes — which happens on each blockchain sync / balance update, i.e. repeatedly while the screen is open. Note also that with `tokenAddress === undefined` (every non-token row) the scan still walks the entire array, lowercasing each contract, before returning null.

**`O(mounted rows x account transactions) string comparisons per transactions-array identity change`** — hot path.

selectTransactionBlockTimeById resolves through selectTransactionByAccountKeyAndTxid, which is a plain `transactions.find(tx => tx?.txid === txid)` over the whole account history (suite-common/wallet-core/src/transactions/transactionsSelectors.ts:133). Every transaction row runs it, and the component already holds the answer: `transaction` is in props and `transaction.blockTime` is the exact field the selector digs out. n grows with account history (TransactionList pages in more on every scroll via fetchTransactionsPageThunk; long-lived BTC/EVM accounts reach thousands). FlashList virtualises so m is viewport-bounded (~10-20 rows) - I am not inflating this - but the memo key is (transactionsArray, txid), and the transactions array identity changes on every addTransaction / page fetch, so every mounted row re-scans the full history on each sync tick. Entry point: AccountDetail / transaction list screen, hot render path.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- The sweeper's impact claim needs correcting before this is filed. selectAccountTokenInfo is built with createWeakMapSelector (suite-common/redux-utils/src/selectorsUtils.ts:24-27, reselect weakMapMemoize on both args and result) over input selectors (account, tokenAddress); the root `state` identity churning on every dispatch only re-runs the cheap input selectors, while the A.find combiner recomputes only when the account OBJECT changes. So this is O(N^2) on mount and once per account update (block/balance sync), NOT once per render. Behaviour delta on the proposed fix: `TokenInfoBranded` is a bare cast here, not a real brand — getAccountListSections does `... as TokenInfoBranded[]` (selectors.ts:350-354) without ever applying shouldUppercaseTokenSymbol, so swapping in plain `token.symbol` WOULD change rendered casing on networks where shouldUppercaseTokenSymbol is true. Either apply shouldUppercaseTokenSymbol at the row, or better, normalise once in getAccountListSections so the cast stops lying. Companion edits: the `useSelector`, `TokensRootState` and `selectAccountTokenSymbol` imports go unused in the row.

- Spans more than one file — see also `suite-native/tokens/src/tokensSelectors.ts:47`.

- The `const account = useSelector(` line is 84; 85 is the selector invocation itself — the snippet spans 84-86, either anchor points at the same call. A Map-based selector should key on `${symbol}:${descriptor}` and live next to selectVisibleDeviceAccountsMap in accountsSelectors.ts; keep first-wins semantics (the current find returns the FIRST matching account, so build the Map with `if (!map.has(key)) map.set(...)` rather than last-write-wins, since the same descriptor+symbol can appear twice across account types in principle). Returning `null` vs `undefined` matters: the current selector returns null for missing descriptor/symbol and the callers do `account?.key`, so a Map `.get()` returning undefined is compatible but changes the selector's declared return type. Virtualising NotificationList is a separate, larger change — file it as a note, not as the fix.

- Spans more than one file — see also `suite-common/wallet-core/src/accounts/accountsSelectors.ts:276`.

- The Set-based rewrite preserves first-wins order exactly (the current reduce keeps the first item per iconKey). The early `break` at MAX_VISIBLE_ROW_ICONS is a real behaviour delta and is safe only because the single consumer is `visibleIcons.slice(0, MAX_VISIBLE_ROW_ICONS)` at :72 — verify no other use of getVisibleRowIcons before adding it (grep shows the function is local to this file and used once at :57). MAX_VISIBLE_ROW_ICONS is declared at :32, above the function, so referencing it inside is fine. TypeScript: `typeof row.activeItems` is EarnDepositsCardActiveItem[] (suite-native/module-earn/src/types.ts:154), a discriminated union on `type` — declaring `const unique: EarnDepositsCardActiveItem[] = []` keeps the narrowing that getRowItemIconKey relies on at :35-37.

- getUtxoOutpoint is exported from @suite-common/wallet-utils and produces the txid:vout key that matches isSameUtxo exactly, so semantics and the resulting order (account.utxo order) are preserved. The same Set also cleans up handleUtxoSelect at :64-74, which additionally contains a confusing double-negative filter `!(isSameUtxo(selected, utxo) ? selected : null)` — worth simplifying to `!isSameUtxo(selected, utxo)` in the same edit, but flag it as a readability change, not a behaviour change (the ternary yields a truthy object or null, so the two are equivalent). Companion edit: isSameUtxo may become unused in this file if both spots are converted — drop the import then.

- `isFirst={filteredSections[0]?.sectionData.key === config.sectionData.key}` is exactly equivalent including the not-found case: findIndex returns -1 when absent, so `sectionIndex === 0` is false, and the key comparison is likewise false. Section keys are `section_${account.key}` (suite-native/trading-state/src/selectors/commonSelectors.ts:370) so they are unique — no first-vs-duplicate ambiguity. Hoisting `const firstSectionKey = filteredSections[0]?.sectionData.key` above the JSX is fine under the React Compiler; the render callback is an inline arrow already, so no new memo dependency is introduced.

- normalizeForSearch is suite-common/suite-utils/src/listFilterUtils.ts:5. The sibling hook useTradeableAssetsFilteredData.ts already does the precompute-map pattern, so the fix has an in-repo precedent. Watch the sort-stability delta: the current comparator returns 0 for equal weights and Array.prototype.sort is stable in Hermes/JSC, so a precomputed weight Map keeps identical order — do not switch to a different tiebreak. Also the `a as MyAssetTradeable` cast at :44 exists because MyAssetRow is a union with the non-tradeable aggregate row ({count, name, isEnabled:false}); any Map keyed on the row object must tolerate that variant (getSortWeight reads .name/.tokenSymbol/.symbol on it), so build the map over the same post-filter array the sort sees, and note the aggregate row is filtered out by filterCallback's !isEnabled guard anyway. There are existing tests at useMyAssetsFilteredData.test.ts covering ordering — run them after the change.

- Spans more than one file — see also `suite-common/trading/src/hooks/useSectionDataFilter.ts:25`.

- Two things temper this and belong in the issue: (a) both HiddenTokensTab and ActiveTokensTab render through a virtualized FlatList `renderItem`, so `rows` is the mounted window (~10-20), not the full token count — the practical cost is a few thousand `toLowerCase()` calls per sync, not a true t^2 blowup; (b) the sweeper's strongest and cheapest sub-claim is the missing guard: with `tokenAddress === undefined` (every non-token row going through CoinAmountFormatter / CoinToFiatAmountFormatter, where `tokenContract` is optional) the predicate compares `string === undefined`, so it walks and lowercases the ENTIRE token array before returning null. Adding `if (!tokenAddress) return null;` above the `A.find` is a two-line, zero-risk change and should be the recommended minimal fix; the Map-index selector is the optional follow-up. The proposed `selectTokensByLowerCaseContract` is sound in shape (weakMapMemoize keys the Map on the account object identity, so one Map per account instead of one scan per row) but the snippet's input-selector arity is sloppy: `selectAccountByKey` needs `(state, accountKey)` forwarded and the second input must keep the `(_state, _accountKey, tokenAddress)` positional signature so all existing call sites (~40, listed under suite-native/module-*, formatters, graph, send, trading) keep compiling unchanged. Preserve first-wins semantics when building the Map (`if (!map.has(key)) map.set(...)`) — `new Map(entries)` is last-wins and would flip which duplicate contract entry is returned. Do NOT drop the `shouldUppercaseTokenSymbol` post-processing at :55-63. Separately worth noting to the implementer: AccountsListTokenItem already receives the full `token` object as a prop, so the selector round-trip exists only to apply `shouldUppercaseTokenSymbol` — deriving the symbol from the prop would remove the scan entirely for that call site.

- Spans more than one file — see also `suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx:34`.

- Fix `const transactionBlockTime = transaction.blockTime ? transaction.blockTime * 1000 : null;` is value-identical (blockTime is `blockTime?: number` on Transaction, packages/blockchain-link-types/src/common.ts:225, so the falsy-guard matches the selector exactly). One behaviour delta: the selector returns null when the txid is not (or no longer) in the store while the prop still carries it — reading the prop is strictly more correct for a row that is being rendered. Both call sites pass the store transaction through unchanged (TransactionListItem.tsx:64,92 and TokenTransferListItem.tsx:108). Companion edits: drop the `selectTransactionBlockTimeById` import (line 13) and, if it becomes the only reason for it, the `TransactionsRootState` type import — note `TransactionsRootState` is still used by the selectIsPhishingTransaction selector at :138-145, so keep it.

- Spans more than one file — see also `suite-common/wallet-core/src/transactions/transactionsSelectors.ts:133`.

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
