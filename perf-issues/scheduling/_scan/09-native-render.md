# Area 9 — suite-native rendering and JS-thread work

Scanned: suite-native/module-home/** (HomeScreen, homescreenSelectors, PortfolioContent, PortfolioGraph, useHomeRefreshControl), suite-native/module-accounts-management/** (AccountsScreen, AccountDetailScreen, AccountDetailContentScreen, AccountDetailGraph, TransactionListHeader, AccountAssets/{ActiveTokensTab,HiddenTokensTab,DefiTokensTab,AccountAssetsTabContent}), suite-native/module-settings/** (SettingsNetworksScreen and components), suite-native/module-onboarding/**, suite-native/module-device-settings/** (screen + hook listing), suite-native/module-transactions/** (TransactionDetailScreen), suite-native/transactions/** (TransactionList, utils, useFetchMissingTransactionFiatRates), suite-native/tokens/**, suite-native/graph/** (hooks, graphThunks, slice, selectors, components), suite-common/graph/** (fetchGraphData, graphDataFetching, graphBalanceEvents, balanceHistoryUtils, graphUtils, constants — native-only package), suite-native/accounts/** (AccountsListWithFilter, SearchableAccountsListHeader, AccountsList/*), suite-native/search/**, suite-native/coin-enabling/**, suite-native/assets/**, suite-common/wallet-core/src/transactions/transactionsThunks.ts (graph fetch path)
Findings: 4

## F9.1 — Chunk the per-transaction balance-history reduction in suite-common/graph so the RN JS thread is not held for the whole account history

- **Anchor:** `suite-common/graph/src/graphDataFetching.ts:180` (also `suite-common/graph/src/graphBalanceEvents.ts:155`, `suite-common/graph/src/balanceHistoryUtils.ts:147`)
- **Class:** long-task
- **Platform:** native
- **What grows:** `allTransactions` — every transaction of the account back to the graph's start date. For the default 720 h timeframe it is one month of history; for the "All" option (`timeframeHours === null`, see `suite-native/graph/src/slice.ts:17` and the `all` option in `TimeSwitch`) `fetchTransactionsFromNowUntilTimestamp` delegates to `fetchAllTransactionsForAccountThunk` and returns the account's _entire_ transaction list. `getAccountHistoryMovementFromTransactions` then walks it and, for the EVM branch (`getAccountHistoryMovementItemETH`), does per transaction: a loop over `tx.details.vin`, a loop over `tx.details.vout`, a loop over `ethereumSpecific.internalTransfers`, and a loop over `tx.tokens`, allocating a fresh `BigNumber` at nearly every step. The package is imported only by `suite-native/graph` and `suite-native/module-accounts-management`, so this is mobile-only code.
- **When it runs:** every time the portfolio graph or an account-detail graph fetches — i.e. on Home screen mount, on account-detail mount, on every timeframe switch, on pull-to-refresh (`useHomeRefreshControl`), and for the portfolio graph once per local-balance-history account (`eth`, `pol`, `bsc`, `xrp`, `arb`, `avax`, `base`, `op`, `rhc`, `hype`, `xlm`) via `Promise.all` in `getMultipleAccountBalanceHistoryWithFiat`. On the account-detail screen it runs **twice over the same data**: once here and once again in `getAccountMovementEvents` (`graphBalanceEvents.ts:155`) for the graph event markers.
- **Blocking-what:** the JS thread of the app the user is actively using — scrolling the Home screen asset list, switching bottom tabs, or (on account detail) scrolling the transaction list that is rendering at the same time. Hermes has no JIT, so the BigNumber-per-field arithmetic is far more expensive than the same code on desktop.
- **Before:**

```ts
if (isLocalBalanceHistoryCoin(symbol)) {
    const allTransactions = await dispatch(
        fetchTransactionsFromNowUntilTimestamp({
            accountKey,
            timestamp: startOfTimeFrameDateTimestamp,
        }),
    ).unwrap();

    const movements = getAccountHistoryMovementFromTransactions({
        transactions: allTransactions,
        symbol,
    });

    tokensFilter?.forEach(tokenAddress => {
        // if there are no movements for this token, we need to add an empty array otherwise it will be skipped
        if (!movements.tokens[tokenAddress]) {
            movements.tokens[tokenAddress] = [];
        }
    });

    return movements;
}
```

- **Proposed fix:** make `getAccountHistoryMovementFromTransactions` (and its three `getAccountHistoryMovementItem*` implementations) async and chunk the `transactions.forEach` into batches of ~200 transactions with an unconditional `await yieldToMain()` between batches; on React Native the only available primitive is `new Promise(resolve => setTimeout(resolve, 0))`, so introduce a single shared `yieldToMain` helper for native rather than scattering timeouts. 200 keeps each batch comfortably under 50 ms even on a mid-range Android. Both call sites are already inside `async` functions (`getBalanceHistory` in `graphDataFetching.ts`, `getBalanceHistory` in `graphBalanceEvents.ts`), so they can simply `await` — no restructuring of the callers is needed. Additionally, the account-detail path should compute the movements once and share the result between `getMultipleAccountBalanceHistoryWithFiat` and `getAccountMovementEvents` instead of walking the same transaction list twice.
- **Risk / ordering:** the reduction is a pure fold into a `Map` keyed by `blockTime` and the sort happens at the end, so batching does not change the result. Yielding does open a window for a second `refetchGraphThunk` to start concurrently; `graphThunks.ts` already guards against this with the `lastFetchTimestamps` WeakMap check (`suite-native/graph/src/graphThunks.ts:119`) and `fetchTransactionsFromNowUntilTimestamp` is a `createSingleInstanceThunk`, so an interleaved refetch is discarded rather than mis-applied. There is currently no cancellation signal threaded into the reduction itself — a long "All"-timeframe reduction will run to completion even after the user leaves the screen, so the chunked loop should also check the same fetch-timestamp guard between batches.
- **Confidence:** high — the collection is the account's full transaction list, the per-item work is explicit in `balanceHistoryUtils.ts`, and the package has no non-native consumer.
- **Priority:** P1

## F9.2 — Defer the graph refetch in useGraphData until after the navigation transition with InteractionManager.runAfterInteractions

- **Anchor:** `suite-native/graph/src/hooks.ts:79` (also `suite-native/graph/src/hooks.ts:82`, `suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx:47`, `suite-native/module-accounts-management/src/components/TransactionListHeader.tsx:79`)
- **Class:** non-essential
- **Platform:** native
- **What grows:** the work the effect kicks off — `refetchGraphThunk` → `fetchGraphData` → one `getAccountBalanceHistory` per account plus `getAccountMovementEvents`, i.e. the full-history reduction of F9.1 plus the per-coin fiat mapping. n is the number of graph accounts times their transaction counts, both unbounded.
- **When it runs:** in a mount effect, the moment the component appears. On the account-detail screen `AccountDetailGraph` is rendered inside `TransactionListHeader`, which is the `ListHeaderComponent` of the transaction `FlashList` — so tapping an account in the accounts list starts the whole graph pipeline in the same frame as the native-stack push animation and the first render of the transaction list. The effect also re-fires whenever `refetchGraph` changes (timeframe switch, base currency change, account list churn during discovery).
- **Blocking-what:** the push/pop transition animation into the account detail screen and the first paint of the transaction list, plus the back gesture if the user immediately turns around. This is the case the RN scheduling guidance calls out explicitly, and the repo has zero `InteractionManager` usages to build on.
- **Before:**

```ts
useEffect(() => {
    if (!isEnabled || !isDeviceAuthorized) return;

    refetchGraph();
}, [isEnabled, isDeviceAuthorized, refetchGraph]);
```

- **Proposed fix:** wrap the dispatch in `InteractionManager.runAfterInteractions(() => refetchGraph())` and return its handle's `cancel()` from the effect cleanup, so a screen the user backs out of before the animation ends never starts the fetch at all. React Native has neither `requestIdleCallback` nor `scheduler.yield`, so `runAfterInteractions` is the only correct primitive here; it resolves as soon as the current interaction/animation handles are released, which for a native-stack push is a few hundred milliseconds — well short of any perceptible delay for a chart that already shows a loading state (`selectAccountGraphIsLoading`). The call site is a `useEffect`, so this is a small local change with no async restructuring.
- **Risk / ordering:** the graph already renders a loading state until the atoms are written, so deferring only lengthens a state the UI is designed for. Two ordering points to preserve: `refetchGraphThunk.pending` currently sets `isLoading` synchronously on mount, so deferring the dispatch also defers the loading flag — the loading state must default to true for a never-fetched instance, or the empty graph flashes first. And the existing cleanup effect in `AccountDetailGraph` (`resetGraphRuntimeState` + `resetGraph` on unmount) must run after the cancelled interaction handle, otherwise a late-resolving handle could write points for an unmounted instance; the `lastFetchTimestamps` guard in `graphThunks.ts` covers the fetch itself but not the pending-state dispatch.
- **Confidence:** high — the mount effect and the mount point inside the list header are both read directly; medium only on the exact perceived duration of the deferral, which depends on the navigator's animation length.
- **Priority:** P1

## F9.3 — Feed the native TransactionList through useDeferredValue so the list model rebuild does not land in the same task as the load-more press

- **Anchor:** `suite-native/transactions/src/components/TransactionList.tsx:210` (also `suite-native/transactions/src/components/TransactionList.tsx:153`, `suite-native/transactions/src/components/TransactionList.tsx:178`)
- **Class:** render-as-long-task
- **Platform:** native
- **What grows:** `transactions` — every transaction loaded for the account so far, appended page by page as the user taps "load more" and grown further by every incoming block. The `data` derivation then does, over that whole array: `arrayPartition`, `groupTransactionsByDate` (which sorts the full array and folds it with a spread accumulator), an `Object.keys(...).sort`, and a `flatMap` that rebuilds every item plus a month-key string. For a token view it additionally re-scans `transaction.tokens` for every transaction.
- **When it runs:** synchronously inside the render triggered by the Redux update — i.e. in the same task as the "load more" press handler resolving, and again on every `BLOCKCHAIN.NOTIFICATION` that adds a transaction while the screen is open. Because the whole array identity changes, the memo never hits and the full `data` array plus a fresh `renderItem` closure are produced each time, which also invalidates every recycled `FlashList` cell.
- **Blocking-what:** the user has just tapped the load-more button at the bottom of the list and is scrolling; the JS thread is what `FlashList` needs to recycle cells, so the list stalls exactly while it is being extended. The account-detail screen is also running the graph pipeline of F9.1/F9.2 at the same time.
- **Before:**

```ts
    const data = useMemo((): TransactionListItem[] => {
        // groupTransactionsByDate now sorts also pending transactions, if they have blockTime set.
        // This is here to keep the original behavior of having pending transactions in one group
        // at the beginning of the list.
        const [pendingTxs, confirmedTxs] = arrayPartition(transactions, isPending);
        const accountTransactionsByMonth = groupTransactionsByDate(confirmedTxs, 'month');
        if (pendingTxs.length || accountTransactionsByMonth['no-blocktime']) {
            accountTransactionsByMonth['pending'] = [
                ...(accountTransactionsByMonth['no-blocktime'] ?? []),
                ...pendingTxs.sort(sortPendingTransactions),
            ];
            delete accountTransactionsByMonth['no-blocktime'];
        }

        const transactionMonthKeys = Object.keys(accountTransactionsByMonth).sort(
            sortKeysPendingFirst,
        ) as MonthKey[];
```

- **Proposed fix:** take the selector result through `useDeferredValue` (`const deferredTransactions = useDeferredValue(transactions)`) and derive `data` from the deferred array, so React renders the extended list at transition priority and can interrupt it for scroll/press work. The app runs React 19.2 on RN 0.85 with the new architecture enabled (`suite-native/app/android/gradle.properties:38`), so concurrent rendering is actually available; `startTransition` around the `dispatch` would not work here because react-redux updates go through `useSyncExternalStore` and are never deferred, which is why `useDeferredValue` on the read side is the right lever. The derivation itself is synchronous inside a render body, so there is nothing to `await` — the fix is purely about the priority the commit runs at.
- **Risk / ordering:** with a deferred value the list lags the store by one pass, so the newly fetched page appears a frame or two after the spinner clears — acceptable, but the `TransactionsListFooter` loading flag reads `selectIsLoadingAccountTransactions` (non-deferred) and would briefly show "not loading" over a not-yet-extended list; both should read from the same deferred generation. `useFetchMissingTransactionFiatRates` at line 251 is keyed off `data.length > 0`, so it would also fire one pass later — harmless, as it is a rate backfill. Pending-transaction ordering is unaffected because the sort inputs do not change.
- **Confidence:** medium — the derivation and its trigger are read directly and the growth of `transactions` is certain; medium rather than high because the per-item cost is dominated by `groupTransactionsByDate`'s spread-accumulator fold, which is separately a complexity defect, and fixing that first would shrink (though not remove) the long task.
- **Priority:** P2

## F9.4 — Replace the 200 ms debounce in SearchForm with useDeferredValue over the non-virtualized accounts list

- **Anchor:** `suite-native/search/src/components/SearchForm.tsx:35` (also `suite-native/accounts/src/components/AccountsListWithFilter.tsx:46`, `suite-native/accounts/src/components/AccountsList/AccountsList.tsx:29`)
- **Class:** render-as-long-task
- **Platform:** native
- **What grows:** the accounts list rendered below the search box. `AccountsList` maps every matching network symbol to an `AccountsListNetworkGroup`, which maps every account type to an `AccountsListAccountTypeGroup`, which maps every account to an `AccountsListItem` — all inside a plain `VStack`, inside the `Screen`'s `ScrollView` (`isScrollable` defaults to `true` in `suite-native/navigation/src/components/Screen.tsx:92`). Nothing is virtualized: every row mounts. Each `AccountsListItem` subscribes to four selectors (`selectFormattedAccountType`, `selectActiveAndDefiTokensCount` twice, `selectAccountHasStaking`, `selectAccountFiatBalance`) and renders four formatter components. n is accounts = enabled networks × account types × discovered indices, which reaches three digits for a user with many coins enabled.
- **When it runs:** 200 ms after the user stops typing in the accounts / send-flow account picker, and again on every network filter apply/clear. `setSearchValue` in `AccountsListWithFilter` is a plain `useState` setter, so the whole subtree re-renders synchronously in that one task.
- **Blocking-what:** the user is typing into the search field and expects the keyboard and the cancel button to stay responsive. The debounce hides the problem by delaying it rather than removing it, and the 200 ms wait is itself perceptible latency on every query.
- **Before:**

```ts
const [inputText, setInputText] = useState('');

// Change the input value after a short time of inactivity to prevent unnecessary re-renders while the user types.
useEffect(() => {
    const timeoutId = setTimeout(() => {
        onInputChange(inputText);
    }, KEYBOARD_INACTIVITY_TIMEOUT);

    return () => {
        clearTimeout(timeoutId);
    };
}, [inputText, onInputChange]);
```

- **Proposed fix:** drop the `setTimeout` debounce, propagate every keystroke immediately, and let the consumer render the expensive subtree from `useDeferredValue(searchValue)` — in `AccountsListWithFilter` that means passing a deferred copy of `searchValue` down to `AccountsList` while the `SearchInput` keeps the live value. React then renders the filtered list at transition priority and can abandon a stale pass when the next keystroke arrives, which is strictly better than a fixed 200 ms guess. `SearchForm` is shared with `useScreenHeaderSearch` (coin-enabling / network settings), where n is bounded by the network list, so those call sites are unaffected either way. This is all render-side; nothing here is async.
- **Risk / ordering:** removing the debounce means `onSearchUsed` analytics in `useScreenHeaderSearch` fires on the first character instead of after the pause — same event, slightly earlier. The unmount effect in `SearchForm` that clears the query (`onInputChange('')`) must stay, otherwise a stale filter survives the search box closing. Deferred rendering can briefly show results for the previous query while the new pass is in flight, so the empty-state check (`AccountsListEmptyPlaceholder` keyed on `!searchValue?.length`) must read the same deferred value or it will flash the wrong placeholder.
- **Confidence:** medium — the non-virtualized structure and the debounce are both read directly, but n depends on how many networks the user enables, so the render cost is large for heavy users and modest for a two-coin wallet.
- **Priority:** P2
