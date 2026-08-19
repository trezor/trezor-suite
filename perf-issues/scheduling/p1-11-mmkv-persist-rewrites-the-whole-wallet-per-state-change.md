# The suite-native persist config sets no `throttle`, so every wallet-changing action re-transforms and double-stringifies the entire account and transaction history

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. This one is scheduling-adjacent rather than a textbook long task, and it is worth saying so up front: the expensive unit here is a single `JSON.stringify` call over one object graph, which cannot be split and cannot be yielded out of. The defect is not that one pass runs too long, it is that the pass runs far more often than it needs to, synchronously, on the one thread React Native has for both React and the user's scroll. The lever is therefore redux-persist's own `throttle` option, not a chunked loop.

## Where

[`suite-native/storage/src/typedPersistReducer.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/typedPersistReducer.ts#L31) — `preparePersistReducer` builds the `persistConfig` object for all 24 persisted reducers in the app. It never sets `throttle`, and redux-persist 6.0.0 defaults it to `0` (`node_modules/redux-persist/lib/createPersistoid.js:14`), which is then used as `setInterval(processNextKey, throttle)` (`:57`). A throttle of `0` does not mean "no throttling" in some benign sense — it means the transform-and-serialize tick is scheduled for the next timer turn after any change, so the coalescing window is one JS tick.

[`suite-native/state/src/reducers.ts:466`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L466) — the root persist reducer, whose whitelist is `['wallet', 'graph', 'tokenDefinitions']` ([`:501`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L501)). `wallet` here is the whole nested wallet subtree: every account and the full transaction history of every account. The nested wallet persist reducer ([`:278`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L278)) is deliberately neutered — `walletStopPersistTransform` returns `undefined` for both of its keys ([`:310`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L310), [`walletTransforms.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/transforms/walletTransforms.ts#L12)) — so the entire payload rides on the root key, as the comment at [`:499-500`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L499-L500) explains: the transform needs `state.device` to decide what to drop, and only the root persistoid sees it.

[`suite-native/storage/src/transforms/walletTransforms.ts:29`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/transforms/walletTransforms.ts#L29) — `walletPersistTransform`, which runs on every one of those ticks. It rebuilds the accounts array and three keyed objects from scratch. Note what its cost is actually proportional to: `A.filter` is one predicate per **account**, and `filterKeysByPartialMatch` ([`utils.ts:20`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/transforms/utils.ts#L20)) iterates the **account keys** of `transactions.transactions` — the transaction arrays themselves are carried into the new object by reference. The transform is O(accounts), not O(transactions). The transaction-proportional term is the serialization that follows it, and there are two of them.

The double serialize is the part worth reading twice. `processNextKey` stores `stagedState[key] = serialize(endState)` — a JSON **string** — at `createPersistoid.js:77`, and then `writeStagedState` calls `serialize(stagedState)` at `:98`, which stringifies that string again, escaping every quote in it. So each write walks the whole wallet payload once to produce it and a second time to escape it, and the second pass also re-escapes the already-staged `graph` and `tokenDefinitions` strings even when only `wallet` changed. `getStoredState.js:29-33` is the mirror image, so cold start pays the same double `JSON.parse`.

[`suite-native/storage/src/mmkvStorage.ts:89`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/mmkvStorage.ts#L89) — the storage adapter. `setItem` is `async`, but only because `ensureMMKV()` is; the write itself is `mmkv.set(key, value)`, and react-native-mmkv 4.3.2 declares that as `set(...): void` — a synchronous Nitro/JSI call that runs on the JS thread. It is a memcpy into an mmap'd buffer, not an `fsync`, so it is genuinely fast; the cost being scheduled here is the two `JSON.stringify` passes in front of it, not the I/O. Nothing about this is off-thread: `persistStore` is created at [`store.ts:154`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/store.ts#L154) with no options, and Hermes has one JS thread.

## Before

`suite-native/storage/src/typedPersistReducer.ts`

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

`suite-native/state/src/reducers.ts`

```ts
        } as const),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph', 'tokenDefinitions'],
        transforms: [
            walletPersistTransform,
            graphPersistTransform,
            tokenDefinitionsPersistTransform,
        ],
        mergeLevel: 2,
        key: 'root',
        version: 5,
```

`suite-native/storage/src/StorageProvider.tsx`

```tsx
export const StorageProvider = ({ children, persistor }: StorageProviderProps) => (
    <StorageContext.Provider value={persistor}>
        <PersistGate loading={null} persistor={persistor}>
            {children}
        </PersistGate>
    </StorageContext.Provider>
);
```

## After

Accept a `throttle` and pass it through. The default stays `undefined`, so the 23 small slices keep today's behaviour and only the root config — the one carrying the wallet — opts in.

`suite-native/storage/src/typedPersistReducer.ts`

```ts
export const preparePersistReducer = <TReducer extends Reducer<any, any>>({
    reducer,
    persistedKeys,
    key,
    version,
    migrations,
    transforms,
    mergeLevel = 1,
    storage,
    throttle,
}: {
    reducer: TReducer;
    persistedKeys: Array<keyof ReducerState<TReducer>>;
    key: string;
    version: number;
    migrations?: MigrationsManifest;
    transforms?: Array<Transform<any, any>>;
    mergeLevel?: 1 | 2;
    storage: MMKVStorage;
    throttle?: number;
}): TReducer => {
    const persistConfig = {
        key,
        storage,
        whitelist: persistedKeys as string[],
        version,
        migrate: createAsyncMigrate<ReducerState<TReducer>>(migrations ?? {}),
        transforms,
        stateReconciler: (mergeLevel === 2 ? autoMergeLevel2 : autoMergeLevel1) as any,
        timeout: 0, // Disable default 5s timeout to prevent occasional data loss.
        throttle,
    };

    return persistReducer(persistConfig, reducer) as TReducer;
};
```

`suite-native/state/src/reducers.ts`

```ts
// A burst of discovery or transaction-paging actions would otherwise re-transform and
// re-serialize the whole account and transaction history once per action.
const ROOT_PERSIST_THROTTLE_MS = 1_000;
```

```ts
        } as const),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph', 'tokenDefinitions'],
        transforms: [
            walletPersistTransform,
            graphPersistTransform,
            tokenDefinitionsPersistTransform,
        ],
        throttle: ROOT_PERSIST_THROTTLE_MS,
        mergeLevel: 2,
        key: 'root',
        version: 5,
```

A throttle is only safe with a matching flush, and the app has none today — `persistor.flush()` has exactly one call site, `ensureSettingsPersisted` in [`ToggleSuiteSyncCard.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-settings/src/components/ToggleSuiteSyncCard.tsx#L41).

`suite-native/storage/src/hooks/useFlushPersistorOnBackground.ts`

```ts
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { type Persistor } from 'redux-persist/es/types';

export const useFlushPersistorOnBackground = (persistor: Persistor) => {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            // Writes are throttled, so the newest state may still be queued at the moment
            // the OS becomes free to kill the app.
            if (nextAppState === 'background') {
                persistor.flush();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [persistor]);
};
```

`suite-native/storage/src/StorageProvider.tsx`

```tsx
export const StorageProvider = ({ children, persistor }: StorageProviderProps) => {
    useFlushPersistorOnBackground(persistor);

    return (
        <StorageContext.Provider value={persistor}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </StorageContext.Provider>
    );
};
```

## Why it matters

The trigger is any action that changes the `wallet` slice reference. `combineReducers` returns the identical object when nothing changed and `persistReducer` bails on that (`persistReducer.js:160`), so idle actions cost nothing — but every account and transaction write counts, and they arrive in bursts:

- **Paging a transaction list.** The user taps _Load more_ in the list footer ([`TransactionList.tsx:304`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L304) → [`:178`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L178)) and keeps scrolling while the page loads. Each page dispatches `transactionsActions.addTransaction` and then `accountsActions.updateAccount` ([`transactionsThunks.ts:635`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L635), [`:643`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L643)), both of which dirty `wallet`.
- **Paging the whole history.** `fetchAllTransactionsForAccountThunk` ([`:714`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L714)) loops pages back to back for as long as the backend keeps returning them, at 25 transactions a page for most networks. Each iteration is one network round trip and at least one persist tick.
- **Discovery.** One `accountsActions.createAccount` per discovered account ([`discoveryThunks.ts:473`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L473)), while the user watches the portfolio populate.
- **Pull to refresh.** [`TransactionList.tsx:189`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L189) fires an account update and a forced first-page refetch together, with the spinner on screen and the list still under the user's thumb.

What each of those ticks costs is proportional to everything already persisted, not to what changed. Adding one page of 25 transactions re-runs the transform over all accounts and then stringifies the complete history twice. So the total serialization work over a paging session is roughly the number of pages times the size of the history — the cost per write grows as the user keeps loading, which is the wrong shape. `n` is unbounded: nothing prunes transactions short of forgetting the wallet or the account, and mobile keeps paging more of it in.

None of this is work the user is waiting for. They are waiting for the next 25 rows and for the list to keep moving under their finger, and every millisecond the persistoid spends in `JSON.stringify` is a millisecond neither React nor the scroll gets, on an engine with no JIT.

After the fix the same bytes are still written and the same transform still runs — just once per second under load instead of once per action. A burst of a dozen actions collapses into one transform and one pair of stringify passes. Nothing the user can see moves or changes; what changes is how much of the JS thread the burst consumes.

## Notes

- **The `After` hunks have not been compiled.** They are written against the surrounding types by reading. `throttle?: number` is part of redux-persist's `PersistConfig` (`node_modules/redux-persist/types/types.d.ts:37`), and `persistConfig` is an object literal inferred at the `persistReducer` call, so the pass-through is type-safe. `AppState.addEventListener` returning a removable subscription matches the existing usage in [`BiometricsModalRenderer.tsx:35-39`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/biometrics/src/components/BiometricsModalRenderer.tsx#L35-L39).
- **The chunking lever from the skill does not apply here, and I am not proposing it.** The dominant cost is one `JSON.stringify` call over one object graph. There is no loop to batch and no point at which control could be handed back — you cannot `await yieldToMain()` inside the engine's serializer. Splitting it would mean hand-rolling a streaming serializer over the persisted subtree, which is a much larger change than the problem justifies. The two levers that do apply are "run it less often" and "run it when the user is not interacting", and only the first is reachable from configuration.
- **Why `InteractionManager` is not in the `After`, despite being the RN lever the sweep normally reaches for.** redux-persist offers no hook to schedule its own tick; `createPersistoid` owns the interval. The only seam we control is `storage.setItem` ([`mmkvStorage.ts:89`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/mmkvStorage.ts#L89)) — and that runs _after_ both `JSON.stringify` passes, so deferring there would move the cheap part and leave the expensive part exactly where it is. Deferring the tick properly means either patching the dependency or driving `persistor.pause()` / `persistor.persist()` from scroll and navigation events, which is a lot of moving parts for a burst that the throttle already collapses. A reviewer who wants the interaction-aware version should ask for it as a follow-up, not fold it in here.
- **Why 1000 ms.** It has to exceed the spacing of a burst to coalesce anything, and page fetches and discovery callbacks land tens to low hundreds of milliseconds apart, so a second captures a useful run of them. It also has to stay short enough that a single deliberate action lands promptly, and the worst case is not the throttle itself: `processNextKey` handles one key per tick, so if `wallet`, `graph` and `tokenDefinitions` are all dirty the envelope write lands `3 × throttle` after the first change. At 1000 ms that worst case is 3 s. At 5000 ms the coalescing gain is small — bursts are shorter than that — while the worst case becomes 15 s. The number is a judgement call and a reviewer should treat it as one.
- **What is lost if the app dies inside the window.** Up to one second of changes to `wallet`, `graph` and `tokenDefinitions`. Balances, transactions and definitions are all re-derivable — the next launch re-runs discovery and `fetchTransactionsPageThunk` force-refetches page 1 regardless ([`transactionsThunks.ts:598`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L598)) — so losing them is a cache miss, not data loss. The one genuine exposure is `accountLabel` ([`account.ts:206`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-types/src/account.ts#L206)), which is user-authored and rides in `wallet.accounts`. The background flush covers the ordinary way a mobile app dies (backgrounded, then killed by the OS or swiped away), and MMKV's write is an mmap memcpy rather than an `fsync`, so the flush is cheap and lands well inside iOS's background grace period. A hard crash inside the window is the uncovered case; if that is judged unacceptable for labels, the label-save path should call `persistor.flush()` the same way [`ToggleSuiteSyncCard.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-settings/src/components/ToggleSuiteSyncCard.tsx#L41) already does for settings.
- **The existing `timeout: 0` comment is about rehydration, not writes.** "Disable default 5s timeout to prevent occasional data loss" refers to `persistReducer.js:78`, where an unfinished read seals the key with `undefined` — it is not evidence about write scheduling, and it is not affected by `throttle`. Worth saying because it reads like a warning against exactly this change and is not one. That the team hit rehydration data loss once is still a fair reason to want the flush landed in the same PR.
- **`flush()` is itself a synchronous long task.** It drains `keysToProcess` in a `while` loop (`createPersistoid.js:117-119`), so the transform and both stringify passes run inline at the moment the app backgrounds. That is the right moment for it — the user has already left — but it is not free, and on a very large history it competes with whatever the OS gives the app on its way out.
- **Only `'background'`, not `'inactive'`.** On iOS `'inactive'` also fires for transient interruptions (Control Center, a call banner) that return straight to `'active'`, and flushing on those puts a synchronous serialize in front of a user who never left. Both platforms pass through `'background'` before the app can be killed from the switcher. A reviewer who wants belt and braces can widen it to `nextAppState !== 'active'` and accept the extra flushes.
- **Deliberately not changed: the double encoding.** It could be removed by passing `serialize: false` and moving one `JSON.stringify` into the MMKV adapter, which would halve the serialization cost per write and the parse cost at cold start. But it changes the on-disk envelope from `{"wallet":"{…}"}` to `{"wallet":{…}}`, so every existing install needs a read path that accepts both, or a migration. That is a storage-format change with its own failure mode and belongs in its own issue; it is also strictly complementary to this one.
- **Deliberately not changed: the transform.** `filterKeysByPartialMatch` builds its result with ts-belt's `D.filterWithKey`, which appends via `concat` (`@mobily/ts-belt/dist/cjs/Dict/index.js:201-203, 402-414`) and is therefore quadratic in allocations over the account keys. That is real but it is the `performance-complexity` sweep's business, `n` there is accounts rather than transactions, and touching it would not change how often any of this runs. Likewise, the transform recomputes `selectDeviceStatesNotRemembered` on every tick even though it only changes when a device is remembered or forgotten; memoizing it saves the small term, not the large one.
- **Splitting `wallet` into its own top-level persist key is not available as written.** It would give the wallet its own persistoid and its own MMKV key, so its writes would stop re-escaping the `graph` and `tokenDefinitions` strings. But a nested persistoid's transform only receives its own subtree, and `walletPersistTransform` needs `state.device` — which is precisely why the comment at [`reducers.ts:499-500`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/reducers.ts#L499-L500) exists and why the nested wallet reducer is stubbed out with `walletStopPersistTransform`. Undoing that arrangement is a restructuring with a migration attached.
- **Test coverage is thin and this change needs some.** `suite-native/storage` has tests only for migrations and `transforms/utils`; there is nothing covering `preparePersistReducer` or the write path, and `createMMKVStorageMock` ([`mmkvStorage.mock.ts:5`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/mmkvStorage.mock.ts#L5)) stubs `setItem` as a resolved `jest.fn()`, which is exactly what a coalescing test needs: dispatch a burst against a real store, advance fake timers, assert `setItem` was called once rather than n times. Any existing test that dispatches and then reads MMKV in the same tick would now need `await persistor.flush()`; I found none, but the Detox e2e suites relaunch the app to assert persisted state and should be run before merging.
- **Honest sizing.** High confidence in the mechanism — the missing `throttle`, the redux-persist default, the transform body, the double serialize and the synchronous MMKV `set` were each read directly. No confidence at all in a number: nothing here was profiled on a device, and a user with three accounts and fifty transactions pays nothing worth measuring. The case for fixing it is that the cost per write scales with total history while the trigger rate scales with activity, and both are unbounded — not that anyone traced a dropped frame to it. If a reviewer wants a measurement first, the cheap one is a `performance.now()` around `writeStagedState` on a seeded large profile.
- **Relationship to [`p1-10`](p1-10-native-gates-first-render-on-the-connect-init-chain.md).** Different path, same thread. That issue is about what runs before first paint; this one is about what keeps running afterwards. They do meet in one place: the double encoding described above is paid symmetrically on rehydration, which happens behind `PersistGate` on the startup path `p1-10` is trying to shorten.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
