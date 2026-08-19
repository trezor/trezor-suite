# `CommonDB.getItemsWithKeys` awaits one IndexedDB round trip per record, eight times on the app-start gate

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, read backwards. This call site is already split into one task per record, and that is the defect: `getItemsWithKeys` walks a cursor and `await`s `cursor.continue()` for every record, so reading a store of `n` records costs `n` serialised request round trips where two batched requests would do. `preloadStore` awaits eight of these inside the single `Promise.all` that gates Suite's first render.

## Where

[`packages/suite-storage/src/index.ts:296`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L296) — the method, with the awaited step at [`:306`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L306) and the cursor opened at [`:298`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L298).

The eight call sites are all in [`packages/suite/src/support/suite/preloadStore.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts), all inside the `Promise.all` at [`:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L63): `historicRates` [`:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L71), `phishing` [`:76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L76), `backendSettings` [`:79`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L79), `sendFormDrafts` [`:80`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L80), `receive` [`:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L81), `formDrafts` [`:82`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L82), `tokenManagement` [`:85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L85) and `suiteSyncOwners` [`:92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L92). A repo-wide grep finds no other caller — eight is the real number, and every one of them is on the boot path.

The cursor exists only because the callers need the primary key alongside the value; nothing in the loop filters, ranges or short-circuits. The same file already reaches for the batched API where it does not need keys — [`:289`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L289) and [`:293`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L293) are bare `getAll()` calls.

## Before

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

## After

```ts
getItemsWithKeys = async <TStoreName extends StoreNames<TDBStructure>>(store: TStoreName) => {
    const db = await this.getDB();
    const tx = db.transaction(store);

    // Both requests must be issued before the first await, otherwise the transaction
    // auto-commits between them. IDB returns keys and values in the same ascending key
    // order, so they zip by index.
    const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()]);

    return keys.map((key, index) => ({ key, value: values[index] }));
};
```

**The IndexedDB semantics, because they decide whether this is legal.** An IDB transaction auto-commits once it has no pending requests and the microtask queue has drained (`idb`'s own README states it as "do not `await` other things between the start and end of your transaction"; the version here is `idb@8.0.3`). Two consequences, and they point in opposite directions:

- The obvious scheduling fix — chunk the walk and `await yieldToMain()` between batches — **is not available here**. A macrotask yield hands control back to the event loop, the read transaction commits while we are away, and the next `cursor.continue()` throws `TransactionInactiveError`. The existing loop survives only because each `await cursor.continue()` resolves out of the cursor's own `success` event, so the next request is queued in the same microtask checkpoint and the transaction never sees an idle turn. Any document in this sweep that proposes yielding inside an open IDB transaction has to open a fresh transaction per batch; this one does not need to, because it stops iterating altogether.
- The `After` is legal for the same reason, used the other way round: `tx.store.getAllKeys()` and `tx.store.getAll()` are both called synchronously, before the `await`, so both are pending when control leaves the function and the transaction stays alive until they resolve. Writing it as `const keys = await tx.store.getAllKeys()` followed by `const values = await tx.store.getAll()` would happen to work too — the second request is issued from the first's success microtask — but it re-serialises the two round trips and is exactly the fragility this issue is about. `Promise.all` is load-bearing, not cosmetic.

Order is spec-guaranteed, not incidental: `getAll()` and `getAllKeys()` both return in ascending key order, which is also the direction a default forward cursor iterates, so `keys[i]` and `values[i]` describe the same record. Types line up unchanged — `idb` declares `getAllKeys(): Promise<StoreKey<…>[]>` and `getAll(): Promise<StoreValue<…>[]>`, and the cursor's `key` was already `StoreKey<…>` for a store cursor, so callers and the `STORAGE.LOAD` payload shape see no change at all.

## Why it matters

This runs on every cold start of Suite, on web and on desktop, while the user is looking at `LoadingScreen` and cannot reach the device prompt, settings or anything else.

`n` is one record per key in the store. Five of the eight scale with the number of accounts across all remembered wallets — `historicRates` ([`definitions.ts:106`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L106)) and `phishing` ([`:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L66)) are keyed by account key, `sendFormDrafts` ([`:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L89)) and `receive` ([`:93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L93)) likewise, and `formDrafts` ([`:196`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L196)) is keyed `${prefix}/${accountKey}` ([`formDraftUtils.ts:7`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/formDraftUtils.ts#L7)), so it is a multiple of accounts. Nothing bounds that number: it grows with every enabled network on every remembered passphrase wallet, and a user with several of those has hundreds of account keys.

**This is a scheduling defect, not a complexity one, and the distinction is the whole issue.** The asymptotics do not change: `O(n)` records are read and `O(n)` values are deserialised before and after, and the resulting array is the same size. What changes is the number of event-loop boundaries the work is cut into. Today each record costs a request to the IDB backing store, a `success` event dispatched as its own task on the renderer main thread, and a microtask that issues the next request — and the loop cannot advance until that completes, so the wall-clock cost of a store is `n × round trip` no matter how idle the machine is. After the change it is two requests issued together and two success events, regardless of `n`. The `await` in the loop is not buying interruptibility that anyone benefits from; it is buying `n − 2` extra serialisation points on a path the user is blocked on.

## Notes

- **The `After` has not been compiled.** It is written against the surrounding `idb` types by reading `node_modules/idb/build/entry.d.ts` (`getAll` and `getAllKeys` on `IDBPObjectStore`, and `CursorKey<…>` collapsing to `StoreKey<…>` when the cursor has no index).
- **No shared helper is involved.** This document does not use `yieldToMain` or `runWhenIdle`; as argued above, yielding mid-transaction is what the fix has to avoid. `@trezor/suite-storage` is `private: true` and consumed only by `packages/suite`, so there is no published-API impact either. Web and desktop only — suite-native does not use IndexedDB.
- **Honest sizing: this is P2 and the ceiling is lower than "eight stores" suggests.** Three of the eight have small bounded `n` — `backendSettings` is one record per network symbol ([`definitions.ts:114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L114)), `tokenManagement` is keyed `${symbol}-${type}-${status}` ([`storageActions.ts:487`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L487)), `suiteSyncOwners` is one per device session ([`definitions.ts:178`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L178)). And `sendFormDrafts`, `receive` and `formDrafts` only hold a record for accounts that actually have a draft or a saved receive state, which for most users is a handful, not one per account. The two that genuinely scale are `historicRates` (written per account whenever transactions are saved, [`storageActions.ts:343`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L343)) and `phishing`.
- **The eight are concurrent, so the gate is the slowest walk, not the sum of eight.** They all sit in one `Promise.all` with 25 other reads, so their round trips interleave. That shrinks the claim further and a reviewer should hold me to it: the win is `max(n_i)` round trips collapsing to two, not `Σ n_i`.
- **The counterpoint a reviewer should push on: peak task length goes up.** The cursor deserialises one value per success event, so the current shape is `n` tiny interruptible tasks; `getAll()` deserialises the whole result in the one task that handles its success event. For `historicRates`, whose every record is that account's full timestamp-to-rate map, that single task could plausibly be a long task in its own right. Two things make me still think the trade is right here: during `preloadStore` the app is a static loading screen with nothing to interrupt for, and [`p1-04`](p1-04-preloadstore-loads-the-whole-transaction-history-before-render.md) moves `historicRates` and `phishing` off this gate entirely — which is the fix for the concentrated-deserialisation risk, and is why the two issues compose rather than compete. If `p1-04` does not land, the `historicRates` walk is the one place where a reviewer could reasonably argue the cursor's interruptibility was worth something.
- **`p1-04` is the boot-path consumer and the ordering between them does not matter.** `p1-04` removes five reads from the gating `Promise.all`, two of which are `getItemsWithKeys`; this one makes every `getItemsWithKeys` cheaper wherever it is called from. Either can land first. Fixing only `p1-04` leaves six of these walks on the critical path; fixing only this one leaves the bulk stores gating first render.
- **Memory peaks slightly higher, briefly.** The current code accumulates `n` `{ key, value }` wrappers; the replacement holds a `keys` array, a `values` array and the mapped result at once. Same order of magnitude, and the values themselves are the dominant term either way, but it is not literally unchanged.
- **No tests break, because none exist.** `packages/suite-storage` contains only `src/index.ts` and its `package.json` declares no test script, and there is no `preloadStore.test.ts`. A change to a storage primitive with zero coverage deserves a `getItemsWithKeys` test in the PR — fake-indexeddb round-tripping a store with several keys and asserting key/value pairing and ascending order — rather than landing bare.
- **What I deliberately did not change.** `removeItemByIndex` ([`:215-220`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L215-L220)) also awaits per record, but it deletes through the cursor and IDB has no batched delete-by-index, so the cursor is the only option there. `getItemsExtended` keeps two more cursor walks — the reverse branch ([`:278-284`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L278-L284)) and the offset/count branch ([`:249-263`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L249-L263)) — but no caller in the repo passes `reverse`, `offset` or `count` today, so both branches are currently dead and fixing them would be speculative. `IDBObjectStore.getAllRecords()` would collapse this to a single request, but it is not in `idb@8.0.3`'s typings and is not Baseline, so two requests is the portable floor.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
