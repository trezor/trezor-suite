# Area 3 — suite-native startup and React Native JS-thread long tasks

Scanned: suite-native/app-init/src/ (appInitThunks.ts, index.ts), suite-native/state/src/ (store.ts, reducers.ts, StoreProvider.tsx, appSlice.ts, receivePersistTransform.ts), suite-native/app/src/ (App.tsx, hooks/useGlobalHooks.tsx, hooks/useReportAppInitToAnalytics.ts, navigation/RootStackNavigator.tsx, navigation/RootStackNavigatorGlobalHooksWrapper.tsx), suite-native/storage/src/ (typedPersistReducer.ts, mmkvStorage.ts, createAsyncMigrate.ts, createEnsureEncryptionKey.ts, StorageProvider.tsx, transforms/), suite-native/sentry/src/, suite-native/blockchain/src/ (blockchainThunks.ts, blockchainMiddleware.ts, useBlockchainConnectionManager.ts), suite-native/discovery/src/discoveryMiddleware.ts, suite-native/message-system/src/messageSystemMiddleware.ts, suite-native/analytics-redux/src/analyticsThunks.ts, suite-native/graph/src/graphThunks.ts, suite-native/module-accounts-import/src/accountsImportThunks.ts, suite-native/module-home/src/screens/HomeScreen/, suite-native/module-activity-center/src/, suite-native/module-accounts-management/src/components/AccountAssets/, suite-native/module-stellar-token-management/src/hooks/, suite-native/module-trading/src/hooks/general/, suite-native/transactions/src/, suite-native/search/src/, plus the suite-common thunks these dispatch (connect-init/connectInitThunks.ts, wallet-core/blockchain/blockchainThunks.ts, wallet-core/fees/feesThunks.ts, token-definitions/tokenDefinitionsThunks.ts, walletconnect/walletConnectThunks.ts, message-system/messageSystemThunks.ts) and node_modules/redux-persist/lib/createPersistoid.js to confirm write scheduling.
Findings: 5

## F3.1 — Stop gating `setIsAppReady(true)` on the awaited Connect + blockchain network chain in suite-native/app-init/src/appInitThunks.ts

- **Anchor:** `suite-native/app-init/src/appInitThunks.ts:131` (also `suite-native/app-init/src/appInitThunks.ts:78`, `suite-native/app-init/src/appInitThunks.ts:85`, `suite-native/app/src/App.tsx:86`)
- **Class:** startup-serialisation
- **Platform:** native
- **What grows:** the awaited chain scales with the user's _enabled networks_ and _persisted accounts_. `initBlockchainThunk` → `preloadFeeInfoThunk` fires one `TrezorConnect.blockchainEstimateFee` per enabled non-hidden network (`suite-common/wallet-core/src/fees/feesThunks.ts:38-47`), each of which needs a live blockbook websocket; then `setBackendsToConnect(...)` and one `reconnectBlockchainThunk` per distinct account symbol (`suite-common/wallet-core/src/blockchain/blockchainThunks.ts:140-148`). Enabled networks and account symbols both grow with what the user turned on, and every one of them is a real network round trip whose latency is bounded only by the connect timeout, not by CPU.
- **When it runs:** every cold app start for any user past onboarding — `App.tsx:73-78` dispatches `applicationInit()` once on mount, and `selectIsOnboardingFinished` is true for every returning user, so `await dispatch(postOnboardingInit())` runs on every launch.
- **Blocking-what:** the user is staring at the splash screen. `App.tsx:86` returns `null` until `isAppReady`, and `App.tsx:80-84` only calls `SplashScreen.hideAsync()` once `isAppReady` flips — so _nothing_ renders until Connect has initialised and the fee/backends/reconnect round trips have all settled. The entire portfolio (accounts, balances, transactions) has already been rehydrated from MMKV by `PersistGate` at that point and could be painted immediately. On a slow or dead network the `try/catch` blocks at lines 79-81 and 86-88 swallow the _error_ but not the _wait_: the splash stays up for the full timeout.
- **Before:**

```ts
    try {
        // Needs to be finished before any TrezorConnect.blockchain* calls.
        await dispatch(initBlockchainThunk()).unwrap();
    } catch (error) {
        console.error(`Blockchain init error: ${JSON.stringify(error)}`);
    }
...
    if (selectIsOnboardingFinished(getState())) {
        await dispatch(postOnboardingInit());
    }

    // Tell the application to render
    dispatch(setIsAppReady(true));
```

- **Proposed fix:** Move `dispatch(setIsAppReady(true))` above the `postOnboardingInit()` await so first paint is gated only on rehydration + `prepareCachedEnvData()`, and let `postOnboardingInit()` run as a detached promise (or behind `InteractionManager.runAfterInteractions`, which is the RN equivalent of `requestIdleCallback` and is currently unused in this repo, so this would set the pattern). Screens that genuinely need Connect already have their own readiness state; keep `await connectInitThunk()` → `await initBlockchainThunk()` ordered relative to each other, just not relative to the render gate. The call site is already `async`, so this is a re-ordering, not a restructuring.
- **Risk / ordering:** Real. Anything that renders before Connect is initialised must tolerate a not-yet-ready Connect — device detection, `TrezorConnect.blockchain*` calls and the discovery middleware all key off actions that arrive later anyway, but the killswitch check at line 74-75 must stay _before_ the ready flag or a killswitched build would flash the app. Detox e2e fixtures preload state and assert on the post-splash screen; they may need to wait on a different signal. Re-entrancy is already guarded by `isApplicationInitDispatchedRef` in `App.tsx:67`.
- **Confidence:** high — the render gate (`App.tsx:86`), the flag write (`appInitThunks.ts:135`) and the awaited network chain are all read end to end.
- **Priority:** P1

## F3.2 — Defer the non-essential init dispatches in suite-native/app-init/src/appInitThunks.ts behind InteractionManager instead of running them before first paint

- **Anchor:** `suite-native/app-init/src/appInitThunks.ts:124` (also `suite-native/app-init/src/appInitThunks.ts:90`, `suite-native/app-init/src/appInitThunks.ts:103`)
- **Class:** non-essential
- **Platform:** native
- **What grows:** `periodicCheckTokenDefinitionsThunk` → `initTokenDefinitionsThunk` fires a definitions download per enabled network per supported definition type (`suite-common/token-definitions/src/tokenDefinitionsThunks.ts:54-82`), and each response is a large contract-address list that gets JSON-parsed on the JS thread; `walletConnectInitThunk` constructs `new Core({...})` and then iterates every stored session and every pending proposal (`suite-common/walletconnect/src/walletConnectThunks.ts:426-472`). Definition payloads grow with the token universe, sessions/proposals grow with the user's WalletConnect history.
- **When it runs:** on every cold start, inside `applicationInit` / `postOnboardingInit`, i.e. while the splash screen is still up and before `setIsAppReady(true)`. Dispatching an async thunk executes its body synchronously up to the first `await`, so the synchronous prologues of `initAnalyticsThunk`, `initMessageSystemThunk`, `initDevices`, `periodicCheckTokenDefinitionsThunk`, `initStakeDataThunk`, `periodicFetchFiatRatesThunk`, `createImportedDeviceThunk` and `walletConnectInitThunk` all land in one task, and their continuations then contend with the render the user is waiting for.
- **Blocking-what:** first paint and device discovery. Analytics (`initAnalyticsThunk` at line 124), message-system polling (line 125), token-definition downloads (line 90) and WalletConnect SDK bring-up (line 103) are none of them what the user opened the app to see.
- **Before:**

```ts
dispatch(initAnalyticsThunk());
dispatch(initMessageSystemThunk());

// Select latest remembered device or Portfolio Tracker device.
dispatch(initDevices());

if (selectIsOnboardingFinished(getState())) {
    await dispatch(postOnboardingInit());
}

// Tell the application to render
dispatch(setIsAppReady(true));
```

- **Proposed fix:** RN has neither `requestIdleCallback` nor `scheduler.yield`, so the lever is `InteractionManager.runAfterInteractions`. Wrap the genuinely non-essential dispatches — `initAnalyticsThunk`, `initMessageSystemThunk`, `periodicCheckTokenDefinitionsThunk`, `walletConnectInitThunk` — in a single `InteractionManager.runAfterInteractions(...)` scheduled _after_ `setIsAppReady(true)` (see F3.1), keeping `initDevices` and the fiat-rate fetch on the fast path since they feed the first screen. Pair it with a `setTimeout` safety net of ~2000 ms, matching the `{ timeout: 2000 }` the skill mandates for `requestIdleCallback`, so a permanently-busy interaction queue cannot starve analytics forever. The call site is `async` already, so scheduling from it is trivial.
- **Risk / ordering:** `initAnalyticsThunk` also calls `allowSentryReport`/`setSentryUser` (`suite-native/analytics-redux/src/analyticsThunks.ts:87-88`), so deferring it widens the window in which early errors are reported without the instance id — acceptable, but worth calling out. `initMessageSystemThunk` must still run before any killswitch-sensitive screen is interactive; the killswitch gate itself reads persisted config, so deferring the _refresh_ is safe, deferring the _read_ is not. `periodicCheckTokenDefinitionsThunk` re-arms itself on a 60 s timer and is also dispatched from `discoveryMiddleware`, so it is idempotent and safe to delay.
- **Confidence:** high for the placement (all lines read, all sit before the ready flag); medium for the per-item cost, which I did not measure on-device.
- **Priority:** P2

## F3.3 — Give the MMKV persistConfig in suite-native/storage/src/typedPersistReducer.ts a throttle so the whole wallet is not re-transformed and double-stringified on every state change

- **Anchor:** `suite-native/storage/src/typedPersistReducer.ts:31` (also `suite-native/state/src/reducers.ts:501`, `suite-native/storage/src/transforms/walletTransforms.ts:29`, `suite-native/state/src/store.ts:154`)
- **Class:** long-task
- **Platform:** native
- **What grows:** the persisted `wallet` subtree — every account and the _entire_ transaction history of every account (`reducers.ts:280` whitelists `['accounts','transactions']` on the wallet reducer, and `reducers.ts:501` re-persists `wallet` at the root). `walletPersistTransform` then walks all accounts (`A.filter`) and every key of `transactions.transactions`, `transactions.phishing` and `transactions.fetchStatusDetail` via `filterKeysByPartialMatch`, which does `filterKeys.some(k => key.includes(k))` per key (`suite-native/storage/src/transforms/utils.ts:20-27`). n is the user's whole transaction history and is unbounded — mobile keeps paging more of it in.
- **When it runs:** on _every_ store update where the `wallet` slice reference changes. `preparePersistReducer` never passes `throttle`, and redux-persist defaults it to `0` (`node_modules/redux-persist/lib/createPersistoid.js:14`, `:57` → `setInterval(processNextKey, throttle)`), so each change schedules the transform + serialize on the very next tick. During discovery that is every `ACCOUNT.CREATE`/`ACCOUNT.UPDATE` and every `TRANSACTION.ADD`; afterwards it is every block with a pending tx and every account refresh. Worse, the payload is stringified twice per write: once per key (`stagedState[key] = serialize(endState)`, line 77) and again for the envelope (`serialize(stagedState)`, line 98).
- **Blocking-what:** the Hermes JS thread, exactly while the user is watching the portfolio populate during discovery or pulling-to-refresh. Hermes has no JIT, so the string scans and the double `JSON.stringify` cost meaningfully more than the same code on web, and every millisecond spent here is a millisecond the list cannot scroll.
- **Before:**

```ts
const persistConfig = {
    key,
    storage,
    whitelist: persistedKeys as string[],
    version,
    migrate: createAsyncMigrate<ReducerState<TReducer>>(migrations ?? {}),
    transforms,
    stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
    timeout: 0, // Disable default 5s timeout to prevent occasional data loss.
};

return persistReducer(persistConfig, reducer) as TReducer;
```

- **Proposed fix:** Add a `throttle` to `persistConfig` (accept it as a parameter, default something like 1000 ms, and give the wallet/root keys the larger value) so a burst of discovery actions coalesces into one transform+serialize instead of one per action — this is the scheduling lever, not a rewrite of the transform. On top of that, schedule the write itself off the interaction path: persisting is by definition not what the user is waiting for, so wrapping the persistoid tick in `InteractionManager.runAfterInteractions` (with a timeout fallback) keeps it out of the way of scrolling and screen transitions. Note `persistor.flush()` must remain synchronous-ish for the backgrounding path, so any throttle needs a matching flush on `AppState` change to `background`.
- **Risk / ordering:** Throttling widens the window in which a kill -9 loses the most recent state; the existing `timeout: 0` comment shows the team has already been bitten by persistence data loss, so this needs a deliberate flush on background/blur. Nothing downstream reads the serialized blob synchronously, and rehydration is unaffected. `walletStopPersistTransform` (which nulls the nested wallet key) and the root transform must keep their current relative order.
- **Confidence:** high — the missing `throttle`, the redux-persist default, the transform body and the double serialize were all read directly.
- **Priority:** P1

## F3.4 — Batch the sequential per-trade awaits in suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts instead of serialising one round trip per trade

- **Anchor:** `suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts:38` (also `suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts:36`)
- **Class:** timeout-misuse
- **Platform:** native
- **What grows:** `tradesToWatch` = every persisted trade whose status is not final (`suite-native/trading-state/src/selectors/commonSelectors.ts:406-409`). Trades are persisted (`reducers.ts:156` whitelists `'trades'` on the trading key) and are never garbage-collected, so any trade that stalls in a non-final status — an abandoned buy, a provider that stops reporting — stays in the watch set forever and the set only grows across the app's lifetime.
- **When it runs:** on mount of the trading surface that uses `useWatchAllTrades` (initial fetch, `hasFetchedInitialTrades === false`), then every 120 s while it stays mounted, and on manual refresh (`useWatchAllTrades.ts:31-39`).
- **Blocking-what:** the user waiting for trade statuses to update. Each iteration `await`s a `tradeApi.watchTrade` HTTP round trip (`suite-common/trading/src/thunks/common/watchTradeThunk.ts:37`), so wall-clock time is n × RTT rather than one RTT — the last trade in the list refreshes n round trips after the first. The awaits do yield the JS thread, so this is latency serialisation rather than a blocked thread.
- **Before:**

```ts
// Refresh all trades that need watching
for (const { account, trades } of tradesByAccount) {
    for (const trade of trades) {
        await dispatch(
            tradingThunks.watchTradeThunk({
                account,
                trade,
                refreshCount: resetCount,
            }),
        );
    }
}
```

- **Proposed fix:** Flatten the nested loop and run the dispatches with bounded concurrency — `Promise.all` over batches of ~5 trades, awaiting between batches — so the refresh completes in ceil(n/5) round trips instead of n while still not opening n sockets at once against the trading provider. The function is already `async`, so this is a local change. If the sequencing exists to respect a provider rate limit, keep the loop but make that explicit in a comment; there is nothing in the current code saying so.
- **Risk / ordering:** `tradeApi.createApiKey(account.descriptor)` is called at the top of `watchTradeThunk` (line 56) and mutates shared API state, so parallel dispatches across _different_ accounts may race on that key — batch within an account, or verify `createApiKey` is safe to interleave, before parallelising across accounts. The `isFetchingRef` guard in `useWatchAllTrades` already prevents a second refresh from interleaving with the first.
- **Confidence:** medium — the loop and the network call are confirmed, but I could not establish a realistic upper bound on how many trades sit in a non-final status for a typical user; the `createApiKey` shared-state hazard is the reason this is not a trivial `Promise.all`.
- **Priority:** P3

## F3.5 — Defer the keystroke filter in suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx with useDeferredValue

- **Anchor:** `suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx:62` (also `suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx:137`)
- **Class:** render-as-long-task
- **Platform:** native
- **What grows:** `inactiveTokens` is built from `coinDefinitions?.data` for Stellar — the full contents of `stellar.advanced.coin.definitions.v1.json` fetched from data.trezor.io (`packages/blockchain-link-utils/src/stellar.ts:124-138`), minus the account's already-activated contracts (`suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts:51-77`). n is the size of the published Stellar classic-asset definition list, which grows with the asset universe and is entirely outside the app's control.
- **When it runs:** on every keystroke in the token-search field. `SearchInput`'s `onChange` is wired straight to `setSearchQuery` (line 137) with no debounce — unlike `@suite-native/search`'s `SearchForm`, which does debounce by 200 ms (`suite-native/search/src/components/SearchForm.tsx:35-43`). Each keystroke therefore re-runs the `filter` over all n tokens and hands `FlashList` a brand-new `data` array in the same synchronous render.
- **Blocking-what:** the user typing. On Hermes (no JIT) three `toLowerCase().includes()` per item over a multi-thousand-entry list, plus FlashList re-keying its window, lands between the keypress and the character appearing.
- **Before:**

```ts
const [searchQuery, setSearchQuery] = useState('');
const isComposingFeesRef = useRef(false);

const filteredTokens = useMemo(() => {
    if (!searchQuery) return inactiveTokens;

    const query = searchQuery.toLowerCase();

    return inactiveTokens.filter(
        token =>
            token.symbol?.toLowerCase().includes(query) ||
            token.name?.toLowerCase().includes(query) ||
            token.contract.toLowerCase().includes(query),
    );
}, [inactiveTokens, searchQuery]);
```

- **Proposed fix:** Keep `searchQuery` as the urgent value that drives the text input, and feed the filter a `useDeferredValue(searchQuery)` so the input updates at keystroke priority while the list re-filters at transition priority — React 18's `useDeferredValue` works on React Native, and this would be the first use of it in Suite. A 150-200 ms debounce matching `SearchForm`'s `KEYBOARD_INACTIVITY_TIMEOUT` is the cheaper alternative and is already the house pattern for search inputs elsewhere in suite-native.
- **Risk / ordering:** Deferring means the list lags the input by a frame or two, which is the intended trade. Nothing reads `filteredTokens` outside render except `renderItem`'s `filteredTokens.length` for the first/last rounding, which tolerates a stale value for one frame. No cancel path needed.
- **Confidence:** medium — the undebounced wiring and the filter are confirmed by reading, and the definitions list is a remote file so n is not app-bounded, but I did not fetch the file to establish its actual entry count; if it turns out to be small this drops to cosmetic.
- **Priority:** P3
