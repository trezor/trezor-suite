# `preloadStore` awaits every persisted transaction row before Suite's first render

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. `preloadStore` gates the whole app behind one `Promise.all` of 33 IndexedDB reads, and three of those reads are bulk wallet data — the full transaction history, the per-account graph, the per-account historic-rate maps — that nothing on the first screen needs. The user is looking at `LoadingScreen` for the duration of the slowest read in that set.

## Where

[`packages/suite/src/support/suite/preloadStore.ts:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L63) — the single `Promise.all` gate, with [`:75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L75) (`txs`), [`:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L71) (`historicRates`), [`:72`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L72) (`graph`) and [`:70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L70) (`tradingTrades`) inside it.

[`packages/suite-web/src/MainWeb.tsx:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-web/src/MainWeb.tsx#L59) and [`packages/suite-desktop-ui/src/MainDesktop.tsx:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L67) — the two call sites. Both render `<LoadingScreen />`, `await preloadStore()`, and only then build the store and render the real tree.

`preloadStore` returns one `@storage/load` action whose payload is the entire persisted snapshot. Everything in the `Promise.all` resolves before the store exists, so render-critical state (`suiteSettings`, `devices`, `accounts`, `walletSettings`, `analytics`, `metadata`, `debug`) and cold bulk state (`txs`, `phishing`, `graph`, `historicRates`, `tradingTrades`) are gated by the same `await`. `db.getItemsExtended('txs', 'order')` takes the unfiltered branch — [`packages/suite-storage/src/index.ts:289`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L289), a bare `index.getAll()` with no account filter and no paging — so it resolves to every persisted transaction row of every remembered wallet.

## Before

```ts
        ] = await Promise.all([
            db.getItemByPK('suiteSettings', 'suite'),
            db.getItemsExtended('devices'),
            db.getItemByPK('thp', 'value'),
            db.getItemByPK('bluetooth', 'value'),
            db.getItemsExtended('accounts'),
            db.getItemByPK('walletSettings', 'wallet'),
            db.getItemsExtended('tradingTrades'),
            db.getItemsWithKeys('historicRates'),
            db.getItemsExtended('graph'),
            db.getItemByPK('analytics', 'suite'),
            db.getItemByPK('metadata', 'state'),
            db.getItemsExtended('txs', 'order'),
            db.getItemsWithKeys('phishing'),
            db.getItemByPK('phishingMetadata', 'phishingMetadata'),
            db.getItemByPK('messageSystem', 'suite'),
            db.getItemsWithKeys('backendSettings'),
            db.getItemsWithKeys('sendFormDrafts'),
            db.getItemsWithKeys('receive'),
            db.getItemsWithKeys('formDrafts'),
            db.getItemsExtended('coinjoinAccounts'),
            db.getItemByPK('coinjoinDebugSettings', 'debug'),
            db.getItemsWithKeys('tokenManagement'),
            db.getItemByPK('persistentDeviceData', 'persistentDeviceData'),
            db.getItemByPK('connect', 'connect'),
            db.getItemsExtended('explorer'),
            db.getItemByPK('bioAuth', 'bioAuth'),
            db.getItemByPK('firmware', 'firmware'),
            db.getItemByPK('suiteSyncSettings', 'suiteSyncSettings'),
            db.getItemsWithKeys('suiteSyncOwners'),
            db.getItemByPK('suiteSyncQuotaManager', 'suiteSyncQuotaManager'),
            db.getItemByPK('featureFeedback', 'featureFeedback'),
            db.getItemByPK('discreetMode', 'discreetMode'),
            db.getItemByPK('debug', 'debug'),
        ]);
```

(The 33 destructured names it assigns to are `preloadStore.ts:30-62`, elided here.)

```tsx
// render simple loader with theme provider without redux, wait for indexedDB
const root = createRoot(container);
root.render(<LoadingScreen />);

const preloadAction = await preloadStore();

const { store, services } = createSuiteWebCompositionRoot(preloadAction);

root.render(
    <ServicesProvider services={services}>
        <ReduxProvider store={store}>
            <MainWeb />
        </ReduxProvider>
    </ServicesProvider>,
);
```

## After

`packages/suite/src/support/suite/preloadStore.ts` — the five bulk stores leave the awaited pass and get their own loader. Everything else, and the `dbError` guard above it, is unchanged.

```ts
        ] = await Promise.all([
            db.getItemByPK('suiteSettings', 'suite'),
            db.getItemsExtended('devices'),
            db.getItemByPK('thp', 'value'),
            db.getItemByPK('bluetooth', 'value'),
            db.getItemsExtended('accounts'),
            db.getItemByPK('walletSettings', 'wallet'),
            db.getItemByPK('analytics', 'suite'),
            db.getItemByPK('metadata', 'state'),
            db.getItemByPK('phishingMetadata', 'phishingMetadata'),
            db.getItemByPK('messageSystem', 'suite'),
            db.getItemsWithKeys('backendSettings'),
            db.getItemsWithKeys('sendFormDrafts'),
            db.getItemsWithKeys('receive'),
            db.getItemsWithKeys('formDrafts'),
            db.getItemsExtended('coinjoinAccounts'),
            db.getItemByPK('coinjoinDebugSettings', 'debug'),
            db.getItemsWithKeys('tokenManagement'),
            db.getItemByPK('persistentDeviceData', 'persistentDeviceData'),
            db.getItemByPK('connect', 'connect'),
            db.getItemsExtended('explorer'),
            db.getItemByPK('bioAuth', 'bioAuth'),
            db.getItemByPK('firmware', 'firmware'),
            db.getItemByPK('suiteSyncSettings', 'suiteSyncSettings'),
            db.getItemsWithKeys('suiteSyncOwners'),
            db.getItemByPK('suiteSyncQuotaManager', 'suiteSyncQuotaManager'),
            db.getItemByPK('featureFeedback', 'featureFeedback'),
            db.getItemByPK('discreetMode', 'discreetMode'),
            db.getItemByPK('debug', 'debug'),
        ]);
```

```ts
// Wallet history is not on screen at first paint, so it is loaded after the first render
// instead of gating it. Only the wallet section reads these stores.
export const preloadDeferredStore = async () => {
    if (!db.isSupported()) return;

    try {
        const [txs, phishing, graph, historicRates, tradingTrades] = await Promise.all([
            db.getItemsExtended('txs', 'order'),
            db.getItemsWithKeys('phishing'),
            db.getItemsExtended('graph'),
            db.getItemsWithKeys('historicRates'),
            db.getItemsExtended('tradingTrades'),
        ]);

        return {
            type: STORAGE.LOAD_DEFERRED,
            payload: {
                txs,
                phishing,
                graph,
                historicRates,
                tradingTrades,
            },
        } as const;
    } catch (error) {
        console.error(error); // Report the error to sentry instead of silently failing

        return {
            type: STORAGE.CORRUPTED,
            payload: error.message,
        } as const;
    }
};

export type PreloadDeferredStoreAction = Awaited<ReturnType<typeof preloadDeferredStore>>;
```

`packages/suite-web/src/MainWeb.tsx` — the deferred read is scheduled once the real tree is rendering. `MainDesktop.tsx:67` gets the same three lines.

```tsx
const { store, services } = createSuiteWebCompositionRoot(preloadAction);

root.render(
    <ServicesProvider services={services}>
        <ReduxProvider store={store}>
            <MainWeb />
        </ReduxProvider>
    </ServicesProvider>,
);

runWhenIdle(
    async () => {
        const deferredAction = await preloadDeferredStore();

        if (deferredAction) {
            store.dispatch(deferredAction);
        }
    },
    { timeout: 2000 },
);
```

## Why it matters

This runs on every cold start of Suite, on web and on desktop. The user has clicked the app icon or hit the URL and is looking at a static `LoadingScreen`; they cannot reach settings, the device prompt or anything else until the last of the 33 reads resolves.

`n` for the bulk half is unbounded and grows monotonically with use: `txs` is one row per transaction per account per remembered wallet, never pruned except when a wallet or account is forgotten, so a user with several remembered passphrase wallets across a dozen networks has an unfiltered `getAll()` over tens of thousands of rows. Each row is deserialised by the structured-clone algorithm on the renderer main thread. `historicRates` is one record per account, but each record is that account's whole timestamp-to-rate map. `graph` and `tradingTrades` are one record per account and per trade.

After the split, first render waits on reads proportional to the number of accounts and a fixed set of single-record lookups, and the part proportional to transaction count runs in an idle callback once the app is on screen. Nothing gets faster in total — the same bytes are still read and still deserialised on the main thread — the app just stops being unreachable while it happens.

What the user sees change: the wallet section can now be reached before its history has arrived, so an account view entered in the first moments after start shows an empty or partial list until the deferred action lands. The `{ timeout: 2000 }` is what guarantees it lands at all — without it a page that never idles may never fire the callback — and `runWhenIdle` falls back to `setTimeout` where `requestIdleCallback` is missing.

## Notes

- **The `After` hunks have not been compiled.** They are written against the surrounding types by reading.
- `runWhenIdle(fn, { timeout })` is the shared helper introduced by whichever of these scheduling issues lands first — proposed home `packages/utils/src/runWhenIdle.ts`, exported from `@trezor/utils`. `requestIdleCallback` is not Baseline (no Safari), so web needs the `setTimeout` fallback; `suite-desktop` is Chromium and always has the real API. This file is web/desktop only, so React Native is not involved.
- **This is the IDB-read half of the boot bottleneck. [`p1-05`](p1-05-rootreducer-hydrates-the-whole-idb-snapshot-in-one-task.md) is the hydration half** — the synchronous reducer pass that turns this payload into store state. They stay separate issues because they are different files and different fixes: this one stops fetching the bulk before render, `p1-05` stops the merge being one uninterruptible task wherever it runs. Fixing only this one moves an unchunked reducer pass off the critical path but leaves it unchunked; fixing only `p1-05` chunks a pass that first render still waits for. A reviewer may reasonably want them in one PR, and if so, `p1-05`'s chunked dispatch is the natural consumer of `preloadDeferredStore`'s payload.
- **The ordering risk that can lose data, and the reason this is not a two-line change.** [`packages/suite/src/middlewares/wallet/storageMiddleware.ts:178-179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L178-L179) reacts to `transactionsActions.addTransaction` for a remembered device by calling `removeAccountTransactions(account)` and then `saveAccountTransactions(account)`, and the latter rebuilds the persisted rows from `getState().wallet.transactions` ([`storageActions.ts:346-363`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L346-L363)). If a blockchain notification or discovery adds a transaction before the deferred action has landed, that path deletes the stored history and writes back only what is in memory. The PR must gate that middleware handler on a hydration flag, or dispatch the deferred load before any wallet write path can run. Do not land the split without this.
- **"Not loaded yet" is not currently distinguishable from "empty".** `transactionsInitialState` is `{ transactions: {}, phishing: {}, fetchStatusDetail: {} }` ([`transactionsReducer.ts:15-19`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L15-L19)), so every consumer that reads `wallet.transactions` on the first frames — the account history view, the dashboard graph, and `updateMissingTxFiatRatesThunk` ([`initAction.ts:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L115), see `p1-03`) — would read "no transactions" rather than "not hydrated". The split needs an explicit flag on the slice.
- **Three of the deferred reducers replace rather than merge**, so a late arrival clobbers anything fetched in between: `loadFromStorage` does `draft.data = payload` ([`graphReducer.ts:86-89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/graphReducer.ts#L86-L89)), `storageLoadHistoricRates` does `state.historic = historicRates` ([`extraDependencies.ts:329-335`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L329-L335)), and `tradingReducer` takes `payload.tradingTrades ?? state.trades` ([`tradingReducer.ts:32-35`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/reducers/tradingReducer.ts#L32-L35)). Either these become merges, or the deferred dispatch has to be guaranteed to land before the first fetch into those slices.
- **New action type, and a native stub.** `STORAGE.LOAD_DEFERRED` is a new constant in [`storageConstants.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/constants/storageConstants.ts) and a new entry in `actionTypes` on the shared contract ([`extraDependenciesType.ts:132-136`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-extra-dependencies/src/extraDependenciesType.ts#L132-L136)). The four reducers that would listen to it instead of `@storage/load` are `transactionsReducer.ts:169-172`, `fiatRatesReducer.ts:136-139`, `graphReducer.ts:113-114` and `tradingReducer.ts:32-35`. suite-native never dispatches `@storage/load` — it hydrates through redux-persist/MMKV and stubs the whole group with `notImplementedActionType` ([`suite-native/state/src/extraDependencies.ts:207-214`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/extraDependencies.ts#L207-L214)) — so the cost on native is one more stub line, not behaviour.
- **Cancellation.** The idle callback needs cancelling if the app tears down mid-start; the `blocked`/`blocking` path at [`preloadStore.ts:20-25`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L20-L25) returns `STORAGE.ERROR` before any deferred read is scheduled, so that case is already covered, but a reload triggered later is not.
- **What I deliberately did not move.** `accounts` and `devices` stay in the critical half — they drive the device list and the sidebar. `formDrafts`, `sendFormDrafts`, `receive`, `backendSettings` and `tokenManagement` also stay: they are per-account, so `n` is accounts rather than transactions, and moving them buys little for the same coordination cost. `tradingTrades` is the weakest member of the deferred set — it is one row per trade and most users have none; a reviewer may reasonably want it left where it is.
- **Where the win is smallest.** On web, the initial route comes from the current URL (`routerInit()`, [`initAction.ts:118`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L118)), so a user who reloads while on an account page needs the transaction history almost immediately and gains only the reordering, not the deferral. The clear win is the common case: opening Suite onto the dashboard or into the device/onboarding flow.
- **No tests exist for this file.** There is no `preloadStore.test.ts`, and no reducer test covers the `@storage/load` path for transactions, fiat rates or graph (`transactionsReducer.test.ts` and `fiatRatesUtils.test.ts` exist but do not touch it). A split like this should come with reducer tests for the deferred action and for the "arrives after a fetch already wrote to the slice" case.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
