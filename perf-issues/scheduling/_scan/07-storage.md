# Area 7 — Storage, IndexedDB and persistence

Scanned: `packages/suite/src/storage/` (index.ts, definitions.ts, migrations/utils.ts, migrations/index.ts, migrations/legacyVersions/, migrations/networks/, all 26 files in migrations/versions/), `packages/suite-storage/src/index.ts`, `packages/suite/src/support/suite/preloadStore.ts`, `packages/suite/src/actions/suite/storageActions.ts`, `packages/suite/src/middlewares/wallet/storageMiddleware.ts`, `packages/suite/src/reducers/store.ts` (initStore region), `packages/suite-web/src/MainWeb.tsx`, `packages/suite-desktop-ui/src/MainDesktop.tsx`, `packages/suite/src/actions/bluetooth/initBluetoothThunk.ts`, `packages/transport-bluetooth/src/client/bluetooth-ipc-main.ts`, `suite-native/storage/src/` (mmkvStorage.ts, createAsyncMigrate.ts, typedPersistReducer.ts, StorageProvider.tsx, createEnsureEncryptionKey.ts, atomWithUnecryptedStorage.ts, transforms/_, migrations/wallet/_, migrations/account/v4.ts), `suite/sentry/src/consent.ts`
Findings: 4

## F7.1 — Stop loading the whole persisted transaction history in `preloadStore` before the app's first real render; split the preload into a render-critical half and a deferred half

- **Anchor:** `packages/suite/src/support/suite/preloadStore.ts:75` (also `:63` — the single `Promise.all` gate, `:71` historicRates, `:72` graph)
- **Class:** startup-serialisation
- **Platform:** web | desktop
- **What grows:** `db.getItemsExtended('txs', 'order')` resolves to _every_ persisted transaction row of _every_ remembered wallet — one row per transaction, no paging, no account filter. A power user with several remembered passphrase wallets across a dozen networks has tens of thousands of rows. `getItemsWithKeys('historicRates')` and `getItemsExtended('graph')` are one record per account, but each `historicRates` record is a full timestamp→rate map for that account's whole history.
- **When it runs:** every cold start of Suite (web and desktop), before the Redux store exists. `MainWeb.tsx` renders `<LoadingScreen />`, then `await preloadStore()`, and only then renders the real tree; `MainDesktop.tsx` does the same.
- **Blocking-what:** opening Suite. The user is looking at the static loading screen and cannot reach settings, the device prompt, or anything else until the last of these 33 reads resolves — and `txs`/`graph`/`historicRates` are needed only once the wallet section is on screen, not for first paint.
- **Before:**

```ts
        ] = await Promise.all([
            db.getItemByPK('suiteSettings', 'suite'),
            db.getItemsExtended('devices'),
            ...
            db.getItemsWithKeys('historicRates'),
            db.getItemsExtended('graph'),
            db.getItemByPK('analytics', 'suite'),
            db.getItemByPK('metadata', 'state'),
            db.getItemsExtended('txs', 'order'),
            db.getItemsWithKeys('phishing'),
```

- **Proposed fix:** Split the `Promise.all` in two. Await only what the first render genuinely needs (suiteSettings, walletSettings, devices, thp, bluetooth, accounts, analytics, metadata, messageSystem, debug, discreetMode) and let `initStore` run on that. Fetch the bulk stores — `txs`, `graph`, `historicRates`, `phishing`, `tradingTrades` — after the first render inside `requestIdleCallback(..., { timeout: 2000 })` (with a `setTimeout` fallback for Safari) and feed them in through a second `STORAGE.LOAD`-style action. The call site is already `async`, so this is a restructuring of one `await`, not a new async boundary; the extra work is defining the second hydration action and making the wallet reducers tolerate a late arrival.
- **Risk / ordering:** Reducers currently assume a single `STORAGE.LOAD` carries everything; a second action means transactions/graph arrive after mount, so anything reading `wallet.transactions` on the first render must handle "not loaded yet" rather than "empty". `db` is a singleton opened lazily, so the deferred reads reuse the same connection — no extra upgrade risk. Cancel path: the idle callback must be cancelled if the app tears down mid-start (e.g. the storage `blocked`/`blocking` path fires and Suite reloads).
- **Confidence:** high — read the whole of `preloadStore.ts`, both `init()` call sites, and `getItemsExtended`'s `txs` branch (`index.getAll()` with no filter, `packages/suite-storage/src/index.ts:289`).
- **Priority:** P1 (unbounded n, gating the very first interaction with the app)
- **Note on overlap:** batch 1 filed `packages/suite/src/reducers/store.ts:191` (the synchronous `rootReducer(undefined, preloadStoreAction)` hydration) and `MainDesktop.tsx:67/:68` (the two sequential awaits). This is the third, distinct link in the same chain and a different fix: batch 1 chunks the reducer that consumes the payload and reorders two awaits; this one stops fetching the payload before render at all. Fixing either alone leaves the other in place.

## F7.2 — Chunk `CommonDB.addItems` — it structured-clones and enqueues every record in one uninterruptible task

- **Anchor:** `packages/suite-storage/src/index.ts:166` (callers: `packages/suite/src/actions/suite/storageActions.ts:354`, `:304`, `:331`)
- **Class:** long-task
- **Platform:** web | desktop
- **What grows:** the `items` array. For `db.addItems('txs', orderedTxs, true)` that is the account's entire transaction history — every persisted transaction for that account, rebuilt and re-put in full. For `saveAccounts` / `saveGraph` it is every account / every graph entry of the device.
- **When it runs:** on every `transactionsActions.addTransaction` for a remembered device (`storageMiddleware.ts:179`), i.e. once per 25-transaction page while a history is being fetched and again on every new block that touches the account; and in one burst per account when the user flips "Remember wallet" (`storageActions.ts:389-404`).
- **Blocking-what:** scrolling and paging through transaction history, and the click on the remember-wallet toggle. `IDBObjectStore.put()` performs the structured clone of its value **synchronously**, inside the `.map()` — so the whole loop is one task on the renderer main thread, proportional to the total byte size of the account's history, before a single frame can be painted.
- **Before:**

```ts
addItems = async <
    TStoreName extends StoreNames<TDBStructure>,
    TItem extends StoreValue<TDBStructure, TStoreName>,
>(
    store: TStoreName,
    items: TItem[],
    upsert?: boolean,
) => {
    const db = await this.getDB();

    const tx = db.transaction(store, 'readwrite');

    await Promise.all([
        ...items.map(item => (upsert ? tx.store.put(item) : tx.store.add(item))),
        tx.done,
    ]);
};
```

- **Proposed fix:** Issue the puts in batches inside one `readwrite` transaction and yield between batches through a single `yieldToMain` helper (`scheduler.yield()` where available, `setTimeout(resolve, 0)` fallback for Safari). ~250 records per batch keeps each task well under 50 ms for typical transaction payloads while keeping the number of yields small. `addItems` is already `async`, so this is a local change. Caveat that must be handled: an IDB transaction auto-commits when the event loop goes idle with no pending requests, so a plain macrotask yield between batches would kill the transaction — open a fresh `readwrite` transaction per batch (giving up all-or-nothing atomicity across the whole set) or keep one request in flight across the yield.
- **Risk / ordering:** Losing single-transaction atomicity means a torn write is observable if the tab is closed mid-batch; for `txs` the caller already deletes-then-rewrites, so a partial state is already reachable there. Re-entrancy matters: two overlapping `saveAccountTransactions` calls for the same account currently serialise inside one IDB transaction each, and per-batch transactions let them interleave — the callers should be coalesced (see the `perf-complexity` p1-02 draft) or guarded by a per-account write queue.
- **Confidence:** high — read `addItems` and all three call sites; the synchronous-clone behaviour of `put()` is spec behaviour (`DataCloneError` throws synchronously), not an inference from a grep.
- **Priority:** P2 (unbounded n; the hottest trigger — one full rewrite per history page — is already drafted as a complexity issue, but this long task survives that fix because `rememberDevice`, `saveAccounts` and `saveGraph` still hand `addItems` the full set)

## F7.3 — Replace `CommonDB.getItemsWithKeys`'s cursor walk with `getAllKeys()` + `getAll()`; eight of them are awaited before Suite can render

- **Anchor:** `packages/suite-storage/src/index.ts:306` (also `:298`; call sites `packages/suite/src/support/suite/preloadStore.ts:71`, `:76`, `:79`)
- **Class:** timeout-misuse (await-in-a-loop serialising work that should be batched)
- **Platform:** web | desktop
- **What grows:** one record per key in the store. `preloadStore` calls it eight times — `historicRates`, `phishing`, `backendSettings`, `sendFormDrafts`, `receive`, `formDrafts`, `tokenManagement`, `suiteSyncOwners`. `historicRates`, `phishing`, `receive`, `sendFormDrafts` and `formDrafts` are all keyed by account key, so n is the number of accounts across all remembered wallets — hundreds for a user with several passphrase wallets and many enabled networks. `formDrafts` is keyed per account _and_ per form-draft prefix, so it is a multiple of that.
- **When it runs:** every cold start, inside the `Promise.all` at `preloadStore.ts:63` that gates the first real render.
- **Blocking-what:** opening Suite. Each record costs one full IDB request round trip — the loop cannot advance until the `continue()` request completes and its success event is dispatched — so the wall-clock cost is `records × event-loop turn`, while `store.getAll()` would fetch the lot in a single round trip.
- **Before:**

```ts
getItemsWithKeys = async <TStoreName extends StoreNames<TDBStructure>>(store: TStoreName) => {
    const db = await this.getDB();
    let cursor = await db.transaction(store).store.openCursor();
    const resp = [];
    while (cursor) {
        resp.push({
            key: cursor.key,
            value: cursor.value,
        });

        cursor = await cursor.continue();
    }

    return resp;
};
```

- **Proposed fix:** The cursor exists only because the callers need the primary key alongside the value. Replace the walk with two batched requests in one transaction — `const [keys, values] = await Promise.all([store.getAllKeys(), store.getAll()])` — and zip them; IDB guarantees both are returned in the same key order. That collapses n round trips to two per store and removes the await-in-a-loop entirely. `getItemsWithKeys` is already `async`, so the change is local and the return shape is unchanged.
- **Risk / ordering:** No observable ordering change — `getAll`/`getAllKeys` return records in ascending key order, the same order the forward cursor produces. Both requests must be issued against the _same_ transaction before any await, otherwise the transaction auto-commits between them. Memory is unchanged: the current code already accumulates every record into `resp`.
- **Confidence:** high — read the method and counted the call sites in `preloadStore.ts`.
- **Priority:** P2 (unbounded n, app-start path; each record is small so the constant is lower than F7.1's)

## F7.4 — `updateAll` writes back every record even when the migration changed nothing; make the migrations return `undefined` and stop awaiting the update

- **Anchor:** `packages/suite/src/storage/migrations/utils.ts:25` (callers returning an unchanged record: `packages/suite/src/storage/migrations/versions/26.2.0.ts:14`, `packages/suite/src/storage/migrations/networks/removeNetwork.ts:17`, `packages/suite/src/storage/migrations/index.ts:959`)
- **Class:** startup-serialisation
- **Platform:** web | desktop
- **What grows:** every row in the `txs` object store — one per persisted transaction across all remembered wallets. `updateAll` is applied to `txs` from ~15 places across the migration set (`migrations/index.ts` alone has 13 `updateAll(transaction, 'txs', …)` calls), each of which walks the whole store.
- **When it runs:** the first launch after a Suite version bump that crosses a migration threshold, inside the IndexedDB `versionchange` transaction opened by `db.getDB()` — which `preloadStore` awaits before the store is created and the app renders.
- **Blocking-what:** opening Suite after an update. The user sits on the loading screen for the whole walk; the `versionchange` transaction also holds the database exclusively, so nothing else can touch it.
- **Before:**

```ts
let cursor = await transaction.objectStore(store).openCursor();
while (cursor) {
    const oldObj = cursor.value as OldValueType;
    const newObj = update(oldObj);

    if (newObj) {
        await cursor.update(newObj);
    } else if (newObj === null) {
        await cursor.delete();
    }

    cursor = await cursor.continue();
}
```

`updateAll`'s own doc comment says "If nothing (void/undefined) is returned, entry is left untouched", but the callers ignore it. `26.2.0.ts` deletes token-network rows and `return transaction;` for everything else; `removeNetwork.ts` deletes rows of the removed symbol and `return tx;` for everything else; `migrations/index.ts:959` rewrites `matic` rows and `return tx;` for everything else. So a bitcoin-only wallet still re-puts every one of its transaction rows, three separate times.

- **Proposed fix:** Two independent changes. (a) In the callers, return `undefined` on the no-op branch so untouched rows cost zero writes — that alone removes the dominant term for most users. (b) In `updateAll`, drop the `await` in front of `cursor.update(newObj)` / `cursor.delete()`: the request is issued synchronously against the same transaction and its completion is already covered by the transaction's `done`, so awaiting it just doubles the round trips per row. Collect the returned promises and `await Promise.all(...)` once after the walk. Both sites are already `async`. Fusing the ~15 separate `txs` walks into one pass is the larger follow-up and is a bigger change than this scan should propose.
- **Risk / ordering:** Not awaiting `cursor.update()` is safe _within_ a cursor walk (the request is queued before `continue()` is called and the transaction stays alive), but the collected promises must be awaited before the migration function returns, otherwise a rejection escapes as an unhandled rejection instead of failing the migration. Returning `undefined` for unchanged rows is behaviour-preserving only if the update callback never mutates `oldObj` in place and relies on the write-back to persist it — `migrations/index.ts:955-957` and `26.2.0.ts:19` do mutate in place, so each caller must be converted to "mutate and return, or return undefined without mutating", not blanket-changed.
- **Confidence:** medium-high — the code and the three callers are read and verified; medium only because the number of `txs` walks a given user actually executes depends on how old their install is (the 13 walks in `migrations/index.ts` run only for `oldVersion < 57`, while `26.2.0` and `removeNetwork` run for everyone crossing those thresholds).
- **Priority:** P2 (unbounded n, but a cold path — once per version upgrade, behind a loading screen)
