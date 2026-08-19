# Area 1 — Suite web/desktop startup and critical path

Scanned: packages/suite/src/actions/suite/ (initAction.ts, analyticsActions.ts, storageActions.ts, suiteActions.ts), packages/suite/src/components/suite/Preloader/, packages/suite/src/reducers/store.ts, packages/suite/src/reducers/suite/suiteReducer.ts, packages/suite/src/support/ (preloadStore.ts, extraDependencies.ts, suite/Main.tsx, suite/Autodetect.tsx, suite/OnlineStatus.tsx, suite/Resize.tsx, suite/ConnectedIntlProvider.tsx), packages/suite/src/hooks/suite/ (useDiscovery.ts, useWindowVisibility.ts, useLocales.ts), packages/suite-web/src/MainWeb.tsx + sentry.ts + createSuiteWebCompositionRoot.ts, packages/suite-desktop-ui/src/MainDesktop.tsx + createSuiteDesktopCompositionRoot.ts + index.tsx, packages/suite/src/actions/bluetooth/initBluetoothThunk.ts, suite-common/connect-init/src/connectInitThunks.ts + blacklist.ts, suite-common/wallet-core/src/blockchain/blockchainThunks.ts, suite-common/wallet-core/src/fees/feesThunks.ts, suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts, suite-common/wallet-core/src/transactions/transactionsSelectors.ts, suite-common/wallet-core/src/device/deviceThunks.ts, suite-common/token-definitions/src/tokenDefinitionsThunks.ts, suite-common/message-system/src/messageSystemThunks.ts + cachedEnvData.ts, suite/router/src/routerThunks.ts + routerReducer.ts, suite/metadata/src/metadataLabelingActions.ts, packages/connect/src/api/blockchainEstimateFee.ts + blockchainUnsubscribeFiatRates.ts
Findings: 8

**Shared context for F1.1–F1.4, F1.7 (verified, referenced below instead of repeated):** `Preloader.tsx:109` renders the full-screen `InitialLoading` spinner until `lifecycle.status === 'ready' && router.loaded && isTransportInitialized`. `router.loaded` is set only by `routerLocationChange` (`suite/router/src/routerReducer.ts:75`), reached from `routerInit()` (`suite/router/src/routerThunks.ts:66-72`), dispatched at `initAction.ts:118`. `lifecycle.status === 'ready'` is set by `SUITE.READY` (`packages/suite/src/reducers/suite/suiteReducer.ts:94-95`), dispatched by `onSuiteReady()` at `initAction.ts:135`. So **every `await` in `init()` between lines 49 and 118 is in front of the app's first usable paint.** The code already knows: `Preloader.tsx:110` carries the comment _"TODO: multiplied by 5, temporarily. Now initActions incorrectly awaits altcoin specific logic which can trigger this timeout easily for bigger accounts"_, and the spinner timeout was raised to `90 * 5` seconds because of it.

## F1.1 — Stop awaiting token-definition and fiat-rate fetches in `initAction.ts` before `routerInit()`; dispatch them after the app is on screen

- **Anchor:** `packages/suite/src/actions/suite/initAction.ts:98` (also `:101`, `:107`, `:115`, gate at `:118`)
- **Class:** startup-serialisation
- **Platform:** shared (web + desktop)
- **What grows:** step 8 downloads a token-definition JSON per enabled network per definition type (`initTokenDefinitionsThunk`, `suite-common/token-definitions/src/tokenDefinitionsThunks.ts:51-83` — a `Promise.all` over `getTokenDefinitionsEnabledNetworks()`, which is the user's enabled-coin list); steps 9 and 10 are two independent `periodicFetchFiatRatesThunk` round trips whose ticker list grows with the number of held tokens (`fiatRatesThunks.ts:383` chunks the tickers 4 at a time and chains the chunks); step 10' scans every persisted transaction (see F1.3). None of these bound; all are user-data-sized.
- **When it runs:** every app start, once analytics consent is confirmed (`Preloader.tsx:73-77`).
- **Blocking-what:** the user is staring at `InitialLoading`. Nothing in the app — not the dashboard, not the coin list, not settings — is reachable until this chain resolves, because `routerInit()` at line 118 is what un-gates the router.
- **Before:**

```ts
// 8. fetch token definitions (has to be fetched before fiat rates)
await dispatch(periodicCheckTokenDefinitionsThunk());

// 9. init periodic fetching of fiat rates
await dispatch(
    periodicFetchFiatRatesThunk({
        rateType: 'current',
        localCurrency,
    }),
);
await dispatch(
    periodicFetchFiatRatesThunk({
        rateType: 'lastWeek',
        localCurrency,
    }),
);

// 10. fetch rates for transactions with missing rates
await dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));

// 11. dispatch initial location change
dispatch(routerInit());
```

- **Proposed fix:** Move `dispatch(routerInit())` and `dispatch(onSuiteReady())` up to immediately after step 7 (or after step 6, gated on transport), then run steps 8–10 as fire-and-forget work scheduled with `requestIdleCallback(..., { timeout: 2000 })` behind a yieldToMain/idle helper (web needs a `setTimeout` fallback — Safari has no `requestIdleCallback`; suite-desktop is Chromium and always has it). Rates and definitions already render as "loading" placeholders in the UI, so nothing needs them at first paint. At minimum, the two `periodicFetchFiatRatesThunk` calls at `:101` and `:107` are independent of each other and should be one `Promise.all`. `init()` is already `async`, so no restructuring is needed to await or not await.
- **Risk / ordering:** The comment at `:97` ("has to be fetched before fiat rates") is a real dependency between step 8 and step 9 — keep those two ordered relative to each other, just not relative to `routerInit`. Un-gating the router earlier means components mount before rates exist; verify each rate consumer tolerates `undefined` (they must already, since these fetches can fail). `init()` is re-entrancy-guarded by the `status !== 'initial'` check at `:42`, so an early `onSuiteReady()` cannot cause a second `init()`.
- **Confidence:** high — the gate chain `routerInit → routerLocationChange → router.loaded → Preloader:109` was read end to end in all four files.
- **Priority:** P1

## F1.2 — Stop awaiting a websocket handshake to every coin backend in `initBlockchainThunk` before Suite is usable

- **Anchor:** `suite-common/wallet-core/src/blockchain/blockchainThunks.ts:148` (also `:127`, called from `packages/suite/src/actions/suite/initAction.ts:93`)
- **Class:** startup-serialisation
- **Platform:** shared (web + desktop)
- **What grows:** `symbols` is the set of distinct network symbols across every persisted account of every remembered wallet (`blockchainThunks.ts:134-145`). `reconnectBlockchainThunk` calls `TrezorConnect.blockchainUnsubscribeFiatRates`, whose `run()` does `await initBlockchain(coinInfo, ...)` (`packages/connect/src/api/blockchainUnsubscribeFiatRates.ts:47-54`) — i.e. it opens the actual backend websocket. `Promise.all` therefore resolves only when the **slowest** backend has connected or exhausted its URL fallback list. `blockchainEstimateFee` is on the connect blacklist (`suite-common/connect-init/src/blacklist.ts:11`) so these calls are not serialised by the `getSynchronize()` wrapper — but they are still all awaited together.
- **When it runs:** every app start, step 7 of `init()`.
- **Blocking-what:** first paint. This is exactly the "altcoin specific logic" the `Preloader.tsx:110` TODO blames for needing a 450-second spinner timeout: one unreachable altcoin backend keeps the whole app behind the loader.
- **Before:**

```ts
const symbols: NetworkSymbol[] = [];
accounts.forEach(a => {
    if (!symbols.includes(a.symbol)) {
        symbols.push(a.symbol);
    }
});

const promises = symbols.map(symbol => dispatch(reconnectBlockchainThunk({ symbol })));
await Promise.all(promises);

dispatch(reportWalletBalanceThunk());
```

- **Proposed fix:** Do not await the fan-out. Return from `initBlockchainThunk` once `preloadFeeInfoThunk` and `setBackendsToConnect` are done, and let the per-symbol reconnects settle in the background — `BLOCKCHAIN.CONNECT`/`BLOCKCHAIN.ERROR` events already drive the per-coin state, so the UI converges on its own. If some coin must be connected before paint, await only the symbol of the currently selected account and schedule the rest via `requestIdleCallback(..., { timeout: 2000 })`. The call site (`initAction.ts:93`) is already `async` and already swallows errors with `.catch(console.error)`, so dropping the await is a one-line change there. Move `reportWalletBalanceThunk()` (analytics) into the same idle callback.
- **Risk / ordering:** `reportWalletBalanceThunk()` at `:150` currently runs only after all reconnects; if the await is dropped it must be re-hooked to the last settled reconnect or to an idle callback, or the reported balance will be read too early. Anything downstream that assumes "backends are up when suite is ready" (account sync timers) has to tolerate a coin still connecting — but it must already, since `reconnectBlockchainThunk` can reject.
- **Confidence:** high — `initBlockchain` inside the connect method was read directly; the Preloader TODO independently corroborates the symptom.
- **Priority:** P1

## F1.3 — Defer `updateMissingTxFiatRatesThunk` off the boot path; it scans every persisted transaction synchronously

- **Anchor:** `suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:333` (also `:339`, scan body at `suite-common/wallet-core/src/transactions/transactionsSelectors.ts:363-411`, call site `packages/suite/src/actions/suite/initAction.ts:115`)
- **Class:** long-task (and non-essential: backfilling historic rates for old transactions is cold data by definition)
- **Platform:** shared (web + desktop)
- **What grows:** with no `accountKey` argument — which is exactly how `initAction.ts:115` calls it — `selectTransactionsWithMissingRates` walks `transactions[accountKey]` for **every** account key in the store and, per transaction, builds a `fiatRateKey` string, rounds the timestamp, and builds one more key string per non-NFT token transfer. n = all persisted transactions across all remembered wallets, unbounded (a heavy user has tens of thousands). This is a genuine full scan, not a missing index, so the lever is scheduling, not a Map.
- **When it runs:** every app start, step 10 of `init()`, immediately before `routerInit()`.
- **Blocking-what:** first paint — the scan runs in one uninterruptible task while the spinner is up, and the `forEach` at `:339` then dispatches a rate-fetch thunk per account in the same task.
- **Before:**

```ts
    ({ localCurrency, accountKey }, { dispatch, getState }) => {
        const transactionsWithMissingRates = selectTransactionsWithMissingRates(
            getState(),
            localCurrency,
            accountKey,
        );

        transactionsWithMissingRates.forEach(({ account, txs }) => {
            dispatch(
                updateTxsFiatRatesThunk({
                    accountKey: account.key,
                    txs,
                    baseCurrencyCode: localCurrency,
                }),
            );
        });
    },
```

- **Proposed fix:** Drop the `await` at `initAction.ts:115` and schedule the whole thunk in `requestIdleCallback(..., { timeout: 5000 })` after `onSuiteReady()` — a 5s timeout is right here because nothing visible depends on it and it should lose every race against user input. If the scan itself still exceeds 50 ms, make the thunk async and drive it per account: call `selectTransactionsWithMissingRates(state, localCurrency, accountKey)` for one account key at a time (the parameter already exists at `:332`) and `await yieldToMain()` between accounts, batching ~1 account per task. The thunk body is currently sync, so making it async is required for the chunked variant; the call site is already `async`.
- **Risk / ordering:** Yielding lets other actions interleave, so re-read `getState()` inside each batch rather than snapshotting the whole map up front — an account can be forgotten or a new tx added mid-scan. `updateTxsFiatRatesThunk` is idempotent per tx, so a re-entrant second call (e.g. currency change) only duplicates network requests, but a cancel token keyed on `localCurrency` would avoid that.
- **Confidence:** high — the unbounded scan and the boot-path call site were both read; only the exact millisecond cost is unmeasured.
- **Priority:** P1

## F1.4 — Split the single synchronous `rootReducer` hydration of the whole IndexedDB snapshot in `store.ts`

- **Anchor:** `packages/suite/src/reducers/store.ts:191` (transaction loop at `packages/suite/src/support/extraDependencies.ts:304`, historic-rate merge at `packages/suite/src/support/extraDependencies.ts:332`, callers `packages/suite-web/src/MainWeb.tsx:61` and `packages/suite-desktop-ui/src/MainDesktop.tsx:70`)
- **Class:** long-task
- **Platform:** shared (web + desktop)
- **What grows:** `preloadStore()` reads every persisted record in one `Promise.all` (`preloadStore.ts:63-97`), including `db.getItemsExtended('txs', 'order')` — one row per transaction per account per remembered wallet. `rootReducer(undefined, preloadStoreAction)` then runs **every** slice's `STORAGE.LOAD` handler in a single synchronous call: `storageLoadTransactions` does a `createAccountKey(...)` string build plus an immer-draft write per transaction (`extraDependencies.ts:304-316`), and `storageLoadHistoricRates` merges every stored rate map via `buildHistoricRatesFromStorage` (`suite-common/wallet-utils/src/fiatRatesUtils.ts:87-107`). n = persisted transactions and rate entries, unbounded.
- **When it runs:** every app start, between `root.render(<LoadingScreen />)` and the first render of the real app tree.
- **Blocking-what:** the user is looking at a bare `LoadingScreen`; the main thread is the only thread and it is inside one reducer call, so nothing paints and no input is processed until it returns.
- **Before:**

```ts
// get initial state by calling STORAGE.LOAD action with optional payload
// payload will be processed in each reducer explicitly
const preloadedState = preloadStoreAction ? rootReducer(undefined, preloadStoreAction) : undefined;
```

- **Proposed fix:** Split `STORAGE.LOAD` into a hot half and a cold half. The hot half (suiteSettings, walletSettings, devices, accounts, analytics, messageSystem, router-relevant flags) stays synchronous and preloads the store as today; the cold half (`txs`, `phishing`, `historicRates`, `graph`, `tradingTrades`) becomes a separate action dispatched after the first paint, chunked ~500 transactions per batch with an unconditional `await yieldToMain()` between batches (500 keeps each batch well under 50 ms while keeping immer overhead per dispatch low). `MainWeb.init`/`MainDesktop.init` are both already `async`, so the chunk loop can live there or in a thunk they dispatch. Reading the `txs` object store lazily per account (it is already keyed) instead of eagerly in `preloadStore` would shrink the payload too.
- **Risk / ordering:** Anything that reads `state.wallet.transactions` during the first frames must handle "not hydrated yet" — the account-history views, the dashboard graph, and `updateMissingTxFiatRatesThunk` (F1.3) all read it. Chunked hydration is also observable to the tx list, which would grow in visible steps; wrapping the batch dispatches in `startTransition` avoids that being a janky cascade. There is no cancel path today; add one keyed on store identity so a reload mid-hydration cannot write into a dead store.
- **Confidence:** medium — n is certainly unbounded and the work certainly runs in one task, but the 50 ms threshold is inferred (immer-draft write + key build per tx), not measured. Worth profiling with a large real profile before sizing the batch.
- **Priority:** P1

## F1.5 — Stop awaiting `initBluetoothThunk` before the desktop app's first real render

- **Anchor:** `packages/suite-desktop-ui/src/MainDesktop.tsx:128` (render gated at `:131`; thunk body `packages/suite/src/actions/bluetooth/initBluetoothThunk.ts:37-63`)
- **Class:** non-essential
- **Platform:** desktop
- **What grows:** not n-shaped — it is two serial IPC round trips (`bluetoothIpc.init({ knownDevices })` then `bluetoothIpc.getInfo()`) that wait on the OS Bluetooth stack coming up in the main process. Latency is bounded by the adapter, not by user data, and on a machine with Bluetooth disabled or a slow adapter it is the worst leg of the whole boot.
- **When it runs:** every desktop app start.
- **Blocking-what:** the user sees only `LoadingScreen`; `root.render(<MainDesktop />)` is three lines below, at `:131`. The Bluetooth panel is not on screen and cannot be until the app renders.
- **Before:**

```ts
    // establish ipc connection with TrezorConnect living in main process
    await TrezorConnect.initIpcProxy();

    // init bluetooth module
    // TODO should it really be here instead of initAction.ts?
    await store.dispatch(initBluetoothThunk());

    // finally render whole app
    root.render(
```

- **Proposed fix:** Render first, then initialise Bluetooth. Move `store.dispatch(initBluetoothThunk())` after `root.render(...)` and schedule it with `requestIdleCallback(..., { timeout: 2000 })` — suite-desktop is Chromium, so the real API is always available, no polyfill needed. The 2 s timeout guarantees it still runs promptly for a user who genuinely boots to pair a BT device. The thunk already does the right thing internally for its own slow half: the 3-second device wait at `initBluetoothThunk.ts:184-204` is a non-awaited `Promise.race(...).then(...)`, so only the two `await`s at `:37` and `:56` need moving. The existing `// TODO should it really be here instead of initAction.ts?` comment at `:127` agrees.
- **Risk / ordering:** The `bluetoothIpc.on(...)` listeners are registered inside the thunk (`:131-178`), so deferring it widens the window in which early adapter/device events are missed — check whether `bluetoothIpc` buffers or whether the main process replays state on `getInfo`. Auto-connect to a known BT device would start a beat later, which is the intended trade. Failure already surfaces as a toast (`:44-53`), which works fine post-render — arguably better, since a toast raised before the tree mounts has nowhere to go.
- **Confidence:** high — the gate is three lines of straight-line code in one file.
- **Priority:** P1

## F1.6 — Run `preloadStore()` and `desktopApi.handshake()` concurrently in `MainDesktop.init`

- **Anchor:** `packages/suite-desktop-ui/src/MainDesktop.tsx:67` (and `:68`)
- **Class:** startup-serialisation
- **Platform:** desktop
- **What grows:** the IndexedDB read grows with persisted data (every transaction row, see F1.4); the handshake is a fixed IPC round trip that waits for the main process to be ready. Neither consumes the other's result — both are only used together on `:70`.
- **When it runs:** every desktop app start.
- **Blocking-what:** the user is on `LoadingScreen`; the sum of both latencies is charged to boot instead of the max.
- **Before:**

```ts
const preloadAction = await preloadStore();
const { statePatch } = await desktopApi.handshake();

const { store, services } = createSuiteDesktopCompositionRoot(preloadAction, statePatch);
```

- **Proposed fix:** `const [preloadAction, { statePatch }] = await Promise.all([preloadStore(), desktopApi.handshake()]);`. Both call sites are inside an already-`async` `init`, so this is a mechanical change. The same pattern is worth checking on web, where `MainWeb.tsx:59` awaits `preloadStore()` alone — there is no second independent await there, so web is clean.
- **Risk / ordering:** `preloadStore` installs `db.onBlocked`/`db.onBlocking` callbacks (`preloadStore.ts:12-13`) and resolves early on a blocked DB; running it concurrently with the handshake does not change that, but it does mean the DB-error branch and the handshake result now land in the same tick — confirm the `db-error` lifecycle path (`Preloader.tsx:96-101`) still wins over `statePatch`. Nothing in the main-process handshake reads IndexedDB, so there is no hidden dependency.
- **Confidence:** high — both awaits and their single joint consumer are in the same eight lines.
- **Priority:** P2

## F1.7 — Schedule `fetchAndSaveMetadataForAllDevices` in an idle callback instead of racing first paint

- **Anchor:** `packages/suite/src/actions/suite/initAction.ts:123` (fan-out at `suite/metadata/src/metadataLabelingActions.ts:278` and `:236-243`)
- **Class:** non-essential
- **Platform:** shared (web + desktop)
- **What grows:** per remembered device, `fetchAndSaveMetadata` fans out over `selectLabelableEntities` — the device plus every account belonging to it — and for each entity does a cloud `getFileContent(fileName)` followed by an AES decrypt and JSON parse on the main thread (`metadataLabelingActions.ts:236-243`, `:72`). n = devices × accounts, unbounded.
- **When it runs:** every app start, step 12 of `init()`, twelve lines before `onSuiteReady()` — so the fan-out is in flight exactly while the app is doing its first real render.
- **Blocking-what:** the first paint and the first interactions. Labels are decoration: every label-rendering component already handles the un-fetched state, because the fetch can fail or the provider can be disconnected.
- **Before:**

```ts
// 12. fetch metadata. metadata is not saved together with other data in storage.
// historically it was saved in indexedDB together with devices and accounts and we did not need to load them
// immediately after suite start.
dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());
```

- **Proposed fix:** Wrap in `requestIdleCallback(() => dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices()), { timeout: 3000 })` behind a shared `runWhenIdle` helper with a `setTimeout` fallback for Safari (web has no `requestIdleCallback` there; desktop is Chromium and always has it). 3 s is a reasonable ceiling — labels appearing a few seconds late is invisible, labels never appearing is a bug. The comment above the call already says this data was deliberately excluded from the boot storage load, so deferring it matches the original intent. The call site is not awaited today, so nothing downstream sequences on it.
- **Risk / ordering:** Store the callback id and cancel it on unmount/reload so a deferred dispatch cannot land in a torn-down store. If the user opens a label editor within the deferral window they would see stale labels briefly; the metadata provider flow already re-fetches on demand, so verify that path covers it.
- **Confidence:** medium — the fan-out and the boot-path dispatch were read directly, but the work only happens when a metadata provider is connected, so the affected population is a subset of users.
- **Priority:** P2

## F1.8 — `analyticsActions.init()` on the Preloader mount effect (named-in-skill)

- **Anchor:** `packages/suite/src/components/suite/Preloader/Preloader.tsx:70`
- **Class:** non-essential
- **Platform:** shared (web + desktop)
- **What grows:** nothing — the thunk reads a handful of selectors and sets the analytics instance/session id and the Sentry user (`packages/suite/src/actions/suite/analyticsActions.ts:66-80`). Bounded, cheap, no loop.
- **When it runs:** first mount of `Preloader`, i.e. the top of the tree, on every app start.
- **Blocking-what:** first paint, marginally.
- **Before:**

```ts
useEffect(() => {
    // Analytics needs to be resolved before we show anything to the user. Until this is solved,
    // we do not init anything. Especially nothing related to the devices/connect. With THP,
    // the autoconnect flow may be automatically triggered, resulting in Suite vs. Device Screen inconsistency.
    dispatch(analyticsActions.init());
}, [dispatch]);
```

- **Proposed fix:** This is the skill's own Rule 2 "bad" example, reported here only because it is unfiled — **named-in-skill**, and the naive fix is contested by the code. The comment at `:67-69` states that analytics must be resolved _before_ anything renders, because `isAnalyticsConsentConfirmed` gates both the consent screen (`:89-91`) and `init()` (`:73-77`), and the THP autoconnect flow depends on that ordering. If it is deferred to `requestIdleCallback`, the consent gate must be re-derived from persisted state rather than from this dispatch. Recommend triaging as a correctness-first refactor, not a mechanical idle-callback wrap.
- **Risk / ordering:** Deferring changes when `isAnalyticsConsentConfirmed` settles, which changes which screen the user sees first and whether device autoconnect fires — the exact inconsistency the comment warns about.
- **Confidence:** high on the facts, low on the value of the mechanical fix — the measurable win is small and the ordering constraint is real.
- **Priority:** P3
