# `CommonDB.addItems` structured-clones every record it is handed in one uninterruptible task

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. `IDBObjectStore.put()` performs the structured clone of its value **synchronously**, so a single `.map()` over the whole array is one task proportional to the total byte size of everything being written — an account's entire transaction history, or every account and graph entry of a wallet. The interesting part of this issue is the fix: the sweep's `yieldToMain()` helper is illegal here, and the reason is worth writing down once for the whole set.

## Where

[`packages/suite-storage/src/index.ts:153`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L153) — `CommonDB.addItems`. It opens one `readwrite` transaction ([`:163`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L163)) and then issues a request per item inside a single `.map()` ([`:166`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L166)). The `await` is on the joined result, not between the puts, so every clone happens in the one task that evaluates that array.

Three callers, all in [`packages/suite/src/actions/suite/storageActions.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts), and all pass unbounded arrays:

- [`:354`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L354) `saveAccountTransactions` — `db.addItems('txs', orderedTxs, true)`, where `orderedTxs` is built at [`:353`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L353) from `transactions[account.key]` in full, not from the page that just arrived. Dispatched from the storage middleware on every `addTransaction` / `removeTransaction` ([`storageMiddleware.ts:179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L179)) and on `markTransactionAsNotScam` ([`:189`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L189)), for any remembered device.
- [`:304`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L304) `saveAccounts` — every account of the device from [`storageMiddleware.ts:142`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L142), single accounts from [`:123`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L123) and [`:154`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L154).
- [`:331`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L331) `saveGraph` — one entry from [`storageMiddleware.ts:256`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L256), the device's whole graph set from `rememberDevice`.

The burst case is `rememberDevice` ([`:374`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L374)): `saveAccounts(accounts)` and `saveGraph(graphData)` ([`:409-410`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L409-L410)) plus one `saveAccountTransactions` per account, all started from one `Promise.all`.

## Before

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

## After

An IndexedDB transaction auto-commits as soon as it goes inactive with no pending requests, so the yield cannot be `yieldToMain()` — see the first note, this is the crux. It can be the batch's own requests: awaiting them resumes inside the dispatch of their success events, where the transaction is still active, and that dispatch is a separate event-loop task, so the main thread is free between batches. Atomicity across the whole set is preserved because it stays one transaction.

`packages/suite-storage/src/index.ts`, module scope:

```ts
// put()/add() clone their value synchronously, so issuing every request in one go makes the call
// one long task. 250 bounds the clone work per task without adding many extra round trips.
const ADD_ITEMS_BATCH_SIZE = 250;
```

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

    // Awaiting the batch's own requests resumes while their success events are still being
    // dispatched, so the transaction is still active and the next batch can be issued. Awaiting
    // anything else - a timer, scheduler.yield() - resumes in a later task, by which time the
    // transaction has auto-committed and put() throws TransactionInactiveError.
    const putBatches = async () => {
        for (let i = 0; i < items.length; i += ADD_ITEMS_BATCH_SIZE) {
            const batch = items.slice(i, i + ADD_ITEMS_BATCH_SIZE);

            await Promise.all(
                batch.map(item => (upsert ? tx.store.put(item) : tx.store.add(item))),
            );
        }
    };

    await Promise.all([putBatches(), tx.done]);
};
```

## Why it matters

Two user actions run this. The first is paging through a remembered wallet's transaction history: every `addTransaction` rewrites the account's **whole** history, not the page, so the array handed to `addItems` grows with the account while the number of calls grows with the number of pages fetched. The second is the click on "Remember wallet", which fans out into `saveAccounts`, `saveGraph` and one `saveAccountTransactions` per account in a single burst.

`n` is the number of records, but the cost is really the total bytes: a `txs` record is `{ tx, order }` ([`definitions.ts:47-50`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/definitions.ts#L47-L50)) whose `tx` is a nested object graph — `targets`, `tokens`, `internalTransfers`, `details.vin` / `details.vout`, and an optional raw `hex`. Structured clone walks all of it, per record, on the renderer main thread, and nothing paints or handles input until the last one is queued. Nothing prunes the store short of forgetting the wallet or the account, so it only grows with use.

Nothing gets faster after the fix — the same clone work happens, and the writes land at the same time. What changes is that it happens as one task per 250 records with the event loop free in between, so a click, a keypress or a paint arriving mid-write is handled between batches instead of after all of them. The user sees nothing new; they stop seeing the wallet freeze while it saves.

## Notes

- **The IDB semantics are the whole point, so state them plainly.** A transaction commits once it becomes inactive and has no requests left. Its active flag is set only during the task that created it and during the dispatch of its requests' events — the microtask checkpoint that resumes an `await` runs inside that dispatch, which is exactly why the promise-based `idb` API works at all. `idb`'s own README says it as "**Do not `await` other things between the start and end of your transaction**" (`node_modules/idb/README.md`, "Transaction lifetime"; `idb: ^8.0.3` at [`packages/suite-storage/package.json:23`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/package.json#L23)). This repo has already been bitten by it: the comment at [`suite-common/test-utils/globalOverrides/index.ts:17-21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/test-utils/globalOverrides/index.ts#L17-L21) exists because a `setimmediate` polyfill broke that interleaving under `fake-indexeddb` and produced `TransactionInactiveError`.
- **So this document deliberately does not use the sweep's `yieldToMain()` helper, and adds nothing to `@trezor/utils`.** It is the one document in the set where the shared helper is the wrong tool. The raw scan also floated "keep one request in flight across the yield" — that does not work: a pending request stops the transaction _committing_, but it does not keep it _active_, so a `put()` issued from a fresh timer task still throws.
- **The rejected alternative: one transaction per batch with `yieldToMain()` between them.** It is the obvious shape and a reviewer may prefer it, but it costs three things. All-or-nothing atomicity goes away, so a torn write becomes observable if the tab is closed mid-run. Two overlapping `saveAccountTransactions` calls for the same account can interleave their batches instead of serialising. And on Safari, where the helper falls back to `setTimeout(resolve, 0)`, every batch past the fifth hits the 5 ms nested-timeout clamp, so the write gets slower the longer it is. Its one advantage — the store's write lock is released between batches — is real; see the next note.
- **The transaction now lives longer.** It spans `ceil(n / 250)` event-loop turns instead of one issuing task, so other `readwrite` work on the same store queues behind it for longer, and a version upgrade waiting on the `blocking` path ([`index.ts:109-117`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L109-L117), which closes the connection after 1 s, [`:88-92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L88-L92)) waits longer too. This is the strongest argument a reviewer has for the per-batch-transaction variant instead.
- **There is no explicit yield in the `After` and none is needed** — but be clear about what that buys. The batch boundary is a real event-loop task boundary, so the browser gets a rendering opportunity; it is not a `scheduler.yield()`-style guarantee about queue position, and we are not adding one.
- **The `After` has not been compiled.** It is written against the surrounding generics by reading. `tx.store.put` / `tx.store.add` return the same wrapped promises the current `.map()` produces, so the joined type is unchanged and `addItems` still resolves to `void`.
- **Batch size 250 is a guess and should be treated as one.** Records vary by orders of magnitude — a two-input BTC transaction versus an EVM transaction with dozens of token transfers, plus the optional raw `hex` — so a fixed record count is a poor proxy for clone cost. A byte-aware batch would be better, but there is no cheap way to size a value before cloning it. Profile a large real wallet before settling on the number.
- **`@trezor/suite-storage` is not a published package**, contrary to the sweep instructions for this document: [`packages/suite-storage/package.json`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/package.json) has `"private": true`, no `publishConfig` and no `build:lib`. This is an internal change with no published-API impact, which also means it is not covered by any external consumer's tests.
- **Test coverage.** Nothing tests `addItems` directly — `packages/suite/src/storage/storage.test.ts` only exercises `addItem` against an uninitiated db. The indirect coverage is `storageActions.test.ts` (`should store remembered device`, [`:280`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.test.ts#L280); graph storage, [`:446`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.test.ts#L446)), which runs on `fake-indexeddb` and would fail loudly if the transaction died mid-loop. The PR should add a `suite-storage` test that writes more than one batch (> 250 items) and asserts every record lands and the transaction commits once — that is the test that catches a future refactor swapping the batch `await` for a timer.
- **Error behaviour is unchanged, and `tx.done` stays handled.** A `DataError` from a missing keyPath field is thrown synchronously by `put()`, so today it escapes mid-`.map()` with the earlier requests already queued and committing — a partial write is already reachable there. The `After` keeps `tx.done` inside the final `Promise.all`, so it never becomes an unhandled rejection if a batch throws. `saveAccounts`'s keyPath diagnostic ([`storageActions.ts:300-320`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L300-L320)) still sees the same rejection.
- **What was deliberately not changed: the callers.** Rewriting an account's whole history on every 25-transaction page is a complexity defect, drafted separately as the `perf-complexity` p1-02 issue. Fixing that shrinks `n` on the hottest path but does not remove this long task, because `rememberDevice` still hands `addItems` every account, every graph entry and every transaction of the wallet in one burst. The two changes are independent and either can land first.
- **Honest sizing: P2, and `n` is smaller than it first looks for most users.** A typical account's history is in the hundreds, i.e. one batch, in which case the `After` is the current behaviour plus one `Promise.all`. This is worth doing because nothing bounds `n`, because the change is confined to a single method, and because the IDB constraint above needs to be written into the code where the next person will see it — not because a long task has been traced here.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
