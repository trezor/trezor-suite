# Area 5 — React render scheduling — Suite web/desktop UI

Scanned: packages/suite/src/views/wallet/tokens/** (index.tsx, TokensNavigation.tsx, coins/CoinsTable.tsx, common/TokensTable/{TokensTable,TokenRow}.tsx), packages/suite/src/views/wallet/transactions/** (TransactionList/_, components/TransactionSummary.tsx), packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/\** (CoinControl.tsx, UtxoSearch.tsx, UtxoSortingSelect.tsx, UtxoSelectionList/_), packages/suite/src/views/settings/SettingsCoins/**, packages/suite/src/views/dashboard/** (AssetsView/AssetsView.tsx, PortfolioCard/DashboardGraph.tsx), packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/** (asset pickers, country selects), packages/suite/src/components/wallet/WalletLayout/AccountsMenu/** (AccountsList.tsx, AccountSearchBox.tsx, AccountSection.tsx), packages/suite/src/components/suite/asset-picker/** (hooks + AssetsList), packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/**, packages/suite/src/components/suite/graph/**, packages/suite/src/hooks/suite/{useAccountSearch.tsx,useGraph.ts}, packages/suite/src/hooks/wallet/form/useUtxoSelection.ts, packages/suite/src/utils/wallet/graph/{utils.ts,utilsWorker.ts}, packages/components/src/components/** (VirtualizedList, form/Select, Table)
Findings: 5

## F5.1 — Defer the token-search query in views/wallet/tokens so the un-virtualised token table is not rebuilt on every keystroke

- **Anchor:** `packages/suite/src/views/wallet/tokens/TokensNavigation.tsx:185` (also `packages/suite/src/views/wallet/tokens/index.tsx:20`, `packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx:56`, `packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx:100`)
- **Class:** render-as-long-task
- **Platform:** web | desktop
- **What grows:** `account.tokens` — every ERC-20/SPL/Stellar asset the backend ever reported for the account. Airdrop/spam contracts are pushed onto any used EVM address without consent, so hundreds to low thousands of entries on a real mainnet account is normal, and nothing in the pipeline caps it. The rendered list is neither paginated nor virtualised: `TokensTable` maps every match to a `TokenRow`, and each `TokenRow` runs two `useSelector` calls, `useTokenYieldBadge`, a `TokenIcon`, `BaseCurrencyValue`, `PriceTicker` and `TrendTicker` (TokenRow.tsx:54-138).
- **When it runs:** every keystroke in the token/collection search box on the Tokens, Collections, Hidden, Inactive and DeFi tabs. There is no debounce and no throttle anywhere on this path (contrast `TransactionList.tsx:66`, which debounces its search 200 ms, and `asset-picker/hooks/useSearchFilter.ts:6`, which throttles 250 ms).
- **Blocking-what:** typing a token name. The keystroke commit does `getTokens` twice (once unmemoised in `TokensNavigation` for the tab counts, once in `CoinsTable`), a `sortTokensByName` sort, and then mounts/unmounts the whole matched row set — so the caret and the next character wait for the full table render.
- **Before:**

```tsx
// TokensNavigation.tsx:179-196 — urgent state update, drives the whole table
<Input
    data-testid="@wallet/accounts/search-icon"
    placeholder={translationString(
        isNft ? 'TR_SEARCH_COLLECTIONS' : 'TR_SEARCH_TOKENS',
    )}
    value={searchQuery}
    onChange={event => setSearchQuery(event.target.value)}
    onClear={() => setSearchQuery('')}

// CoinsTable.tsx:56-66 — recomputed synchronously in the same commit
const tokens = useMemo(() => {
    const groupedTokens = getTokens({
        tokens: enhancedTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
        searchQuery,
    });
    groupedTokens.shownWithoutBalance.sort(sortTokensByName);

    return groupedTokens;
}, [enhancedTokens, account.symbol, coinDefinitions, searchQuery]);
```

- **Proposed fix:** Keep `searchQuery` as the urgent controlled value of the `Input`, and derive a `useDeferredValue(searchQuery)` in `views/wallet/tokens/index.tsx` that is what gets passed to `CoinsTable`/`HiddenTokensTable`/`InactiveTokensTable`/`DefiTokensTable`. The input then repaints per keystroke while the table re-renders at transition priority and can be interrupted by the next character; React 19.2 is already the version in use (`package.json:113`), so `useDeferredValue` with an initial value is available. All call sites are plain render code, so no async restructuring is needed. Optionally mark the stale table with `opacity` while `deferred !== searchQuery`.
- **Risk / ordering:** No ordering risk — the deferred value only ever lags the input by one commit and converges. The tab counts in `TokensNavigation` (line 126) are computed from the unfiltered account tokens and are unaffected by the search, so they can stay urgent. Watch that `TokensTable`'s `useEffect` dispatching `tradingThunks.loadInitialDataThunk` (TokensTable.tsx:60-62) fires on mount only, so deferring does not change how often it runs.
- **Confidence:** high — read all four files; the list is provably un-virtualised (`TokensTable.tsx:100` and `:127` map the full arrays) and no debounce exists on this path.
- **Priority:** P1

## F5.2 — Defer the UTXO search query in CoinControl instead of re-scanning `account.utxo` on every keystroke

- **Anchor:** `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx:37` (also `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:107`, `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelectionList.tsx:69`)
- **Class:** render-as-long-task
- **Platform:** web | desktop
- **What grows:** `account.utxo` — one entry per unspent output. Grows with every received payment and never shrinks until spent; coinjoin accounts and donation/merchant addresses routinely sit in the thousands. `filterAndCategorizeUtxos` walks four arrays (`utxos`, `spendableUtxos`, `lowAnonymityUtxos`, `dustUtxos`) — roughly 2n `filterUtxos` calls, each doing three `toLowerCase().includes()` plus two Map lookups. On top of that, the 25 rendered rows each run `accountTransactions.find(...)` over the whole loaded transaction history (`UtxoSelectionList.tsx:69`).
- **When it runs:** every keystroke in the coin-control UTXO search, inside the send form. `UtxoSearch.onSearch` calls `setSearch` + `setSelectedPage` with no debounce, and `CoinControl` calls `filterAndCategorizeUtxos` unmemoised in its render body.
- **Blocking-what:** typing a txid/address/label fragment while composing a transaction — the most latency-sensitive screen in the app, often with the device connected and a compose request in flight.
- **Before:**

```tsx
// UtxoSearch.tsx:35-41
const onSearch = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
        setSearch(target.value);
        setSelectedPage(1);
    },
    [setSearch, setSelectedPage],
);

// CoinControl.tsx:106-115 — unmemoised, runs in the same commit as the keystroke
// Filter UTXOs based on searchQuery
const { filteredUtxos, filteredSpendableUtxos, filteredLowAnonymityUtxos, filteredDustUtxos } =
    filterAndCategorizeUtxos({
        searchQuery,
        utxos: account.utxo || [],
        spendableUtxos,
        lowAnonymityUtxos,
        dustUtxos,
        outputLabels,
    });
```

- **Proposed fix:** In `CoinControl`, keep `searchQuery` urgent (it is the `Input`'s `value`) and feed `useDeferredValue(searchQuery)` into `filterAndCategorizeUtxos` and into the pagination maths, so only the list/pagination render is a transition. Both call sites are synchronous render code, so this is a two-line change plus threading the deferred value; no restructuring. Pagination is already 25 per page, so the render itself stays bounded — the transition is buying interruptibility for the scan and for the 25 heavy rows.
- **Risk / ordering:** `setSelectedPage(1)` must stay urgent and in the same handler, otherwise a deferred filter could briefly be paged against a stale index; because the page reset is urgent and the filter lags, the intermediate frame shows page 1 of the previous result set, which is visually acceptable. `handleAllUtxosSelected` (CoinControl.tsx:161-165) clears the search and must keep clearing the urgent value. No cancel path exists or is needed — the deferred render is simply discarded.
- **Confidence:** high on the defect (no debounce, unmemoised scan on the keystroke commit); medium on the absolute millisecond cost, which depends on UTXO count — it is only clearly over the 50 ms bar for coinjoin-scale accounts.
- **Priority:** P2

## F5.3 — Defer `searchString` in the accounts sidebar so account filtering does not run urgently on every keystroke

- **Anchor:** `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:93` (also `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSearchBox.tsx:23`, `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx:46`)
- **Class:** render-as-long-task
- **Platform:** web | desktop
- **What grows:** the account list — one entry per (network, account type, index) the device has discovered, plus every account the user adds manually. With all coins enabled and several BTC account types this reaches dozens to low hundreds, and it is user-extensible without limit. Worse, the filter calls `getTokens` _per account_ (AccountsList.tsx:105-109), which allocates two `Set`s and walks that account's whole token list, so the per-keystroke cost is O(accounts × tokens). Every surviving account then renders an `AccountSection`, which runs `getTokens` for that account _again_ (AccountSection.tsx:46-50); the list is not virtualised.
- **When it runs:** every keystroke in the sidebar account search. `AccountSearchBox` dispatches `setSearchString` straight to the redux `accountSearch` slice with no debounce; the value reaches `AccountsList` through `ReduxAccountSearchProvider`'s context.
- **Blocking-what:** typing in the primary navigation control of the whole wallet — the sidebar is mounted on every wallet route, so this competes with whatever the main pane is doing.
- **Before:**

```tsx
// AccountsList.tsx:93-110
const filteredAccounts =
    searchString || coinFilter
        ? accounts.filter(account => {
              const { key } = account;

              const accountLabel =
                  account.label ??
                  (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                      ? accountLegacyLabels[key]
                      : getDefaultAccountLabel(translationString, account)) ??
                  '';

              const { shownWithBalance } = getTokens({
                  tokens: account.tokens ?? [],
                  symbol: account.symbol,
                  tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
              });
```

- **Proposed fix:** Take `const deferredSearch = useDeferredValue(searchString)` inside `AccountsList` and use it for the `filter` while `AccountSearchBox` keeps rendering the raw `searchString` from context. `useDeferredValue` is the right primitive rather than `startTransition` here because the value originates in redux — react-redux 9 subscribes via `useSyncExternalStore`, and external-store updates are never downgraded to transition priority, so wrapping the `dispatch` in `startTransition` would not defer anything. Pure render change, nothing async.
- **Risk / ordering:** `coinFilter` (the coin chips) should stay urgent or be deferred together with the string — deferring only one of the two would show a frame filtered by a mismatched pair, which is harmless but jumpy; deferring both keeps them consistent. The "no results" branch (AccountsList.tsx:152-157) reads `searchString`, so it must read the same deferred value to avoid flashing "no results" for one frame while the deferred list still holds matches.
- **Confidence:** high — read the search box, the context/redux plumbing and the list; there is provably no debounce, no memo and no virtualisation on the path.
- **Priority:** P1

## F5.4 — Defer the graph range in TransactionSummary; the balance-history aggregation runs synchronously in the render body

- **Anchor:** `packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx:48` (also `packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx:51`, `packages/suite/src/components/suite/graph/GraphRangeSelector.tsx:176`)
- **Class:** render-as-long-task
- **Platform:** web | desktop
- **What grows:** the account's balance-history points — one per day (or per month) from the account's first transaction to today, so it grows linearly with account age and is unbounded for long-lived accounts. `aggregateBalanceHistory` (utilsWorker.ts:32-127) allocates three `FiatValueMap`s per point, and each map is built by `calcFiatValueMap` over _every_ fiat symbol present in that point's `rates` object, each entry constructing a `BigNumber` via `toFiatCurrency`. So the real multiplier is points × 3 × fiat-currencies. `getGraphDataForInterval` additionally re-filters every point through `isWithinInterval`, and `getMinMaxValueFromData` (utils.ts:149) walks the result allocating three more `BigNumber`s per point.
- **When it runs:** on every render of the account Transactions page, and specifically on each click of the day/week/month/year/all `SelectBar` — `setSelectedRange` dispatches to redux, `TransactionSummary` re-reads `state.wallet.graph` and recomputes from scratch. There is no `useMemo` and packages/suite is not compiled with React Compiler (no react-compiler config anywhere in the repo), so nothing caches this.
- **Blocking-what:** clicking a range on the account graph. The `SelectBar` thumb, the spinner and any concurrent scroll all wait for the aggregation plus the recharts re-render in the same commit. Note the sibling dashboard graph deliberately pushes this same work off the commit (see F5.5), while the account graph does it inline.
- **Before:**

```tsx
// TransactionSummary.tsx:41-52
export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const graph = useSelector(state => state.wallet.graph);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const isGraphDataLoaded = intervalGraphData.length > 0;
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];
```

- **Proposed fix:** Wrap the range in `useDeferredValue` (`const deferredRange = useDeferredValue(selectedRange)`) and compute `intervalGraphData`/`data`/`minMaxValues`/`xTicks` from the deferred range inside a `useMemo`, so the `SelectBar` flips instantly and the graph catches up at transition priority; pass `isLoading || deferredRange !== selectedRange` to `TransactionsGraph` so the existing spinner covers the lag. As in F5.3, `startTransition` around the `setSelectedRange` dispatch would not help because the value comes from redux via `useSyncExternalStore`. Everything here is synchronous render code.
- **Risk / ordering:** `onSelectedRange` also dispatches `updateGraphData` (line 89-94) which fetches; that must stay on the urgent path so the fetch is not delayed. `SummaryCards` consumes `data` and `dataInterval` and must read the same deferred range, otherwise the cards and the graph would disagree for a frame. No re-entrancy concern — the computation is pure.
- **Confidence:** high — the computation is verifiably in the render body with no memo, and the trigger is a user-facing control on the same screen.
- **Priority:** P2

## F5.5 — Replace the `setTimeout(…, 0)` "poor man's web worker" in prepareGraphDataAsync with a real yield or worker

- **Anchor:** `packages/suite/src/utils/wallet/graph/utilsWorker.ts:143` (also `packages/suite/src/utils/wallet/graph/utilsWorker.ts:134`, `packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx:98`)
- **Class:** timeout-misuse
- **Platform:** web | desktop
- **What grows:** the same balance-history point count as F5.4, but summed across _every_ account of the selected device (`getGraphDataForInterval` with `deviceState` and no account filter, utils.ts:367-397). A device with 30 accounts and multi-year history feeds tens of thousands of points into `aggregateBalanceHistory`, each allocating three fiat maps over all available fiat symbols.
- **When it runs:** from a `useEffect` in `DashboardGraph` that depends on the whole `graph` slice — so on dashboard mount, on every graph-data update, on base-currency change, and on every range-selector click.
- **Blocking-what:** the dashboard's first meaningful paint and every subsequent range switch. The comment above the function asserts the opposite of what the code does — a `setTimeout(0)` moves the work to the next macrotask but still runs all of it in one uninterruptible task on the main thread, so the renderer lags exactly as much, just one tick later. It also appends to the back of the task queue, which is the documented fallback, not the goal.
- **Before:**

```ts
/**
 * Poor man's substitute for web worker, but it does the job perfectly - does expensive calculations async without
 * lagging the renderer thread.
 */
export const prepareGraphDataAsync = ({
    graph,
    deviceState,
}: PrepareGraphDataAsyncProps): Promise<GraphDataPoint<'dashboard'>[]> =>
    new Promise(resolve => {
        window.setTimeout(() => {
            const history = getGraphDataForInterval({ deviceState, graph });
            const { groupBy } = graph.selectedRange;
            const type = 'dashboard';
            const aggregatedData = aggregateBalanceHistory(history, groupBy, type);
            resolve(aggregatedData);
        }, 0);
    });
```

- **Proposed fix:** The function is already `async` at the call site (`.then(...)` in DashboardGraph.tsx:98), so it can await inside. Make `aggregateBalanceHistory` chunked: iterate `graphData` (and, for a single large account, its `accountHistory`) in batches of ~500 points and `await yieldToMain()` between batches — `scheduler.yield()` where available, `setTimeout(resolve, 0)` behind the same helper for Safari, with suite-desktop always getting the real primitive. Alternatively restore a real Worker, which the file name and the `index.ts` comment ("TODO reorganize, because worker is no more") say used to exist; that is the better long-term fix since the aggregation is pure and takes plain JSON. Either way, delete the comment claiming the current code does not lag the renderer.
- **Risk / ordering:** Chunking makes the promise resolve over several tasks, so a second call can now overlap the first — `DashboardGraph`'s effect fires on every `graph` change and already has no cancellation, so a stale result can currently win the race; adding an ignore-flag (or `AbortSignal`) in the effect cleanup should be part of the change rather than a follow-up. The aggregation itself is order-independent per point except for the per-bin accumulation, which stays inside a batch's sequential loop, so results are unchanged.
- **Confidence:** high — the function is short, fully read, and the single call site is read.
- **Priority:** P2
