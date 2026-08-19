# IDB migration callbacks rewrite every record in a store even when the migration changed nothing about that record

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. This is the call site where that section's lever is **not available**: the work runs inside an IndexedDB `versionchange` transaction, which auto-commits the moment the event loop goes idle, so an `await yieldToMain()` between batches would close the transaction mid-migration. The only legal move on this path is to stop doing the work, and most of the work here buys nothing.

## Where

[`packages/suite/src/storage/migrations/utils.ts:19`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L19)–[`:31`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L31) — `updateAll` walks an object store with a cursor and applies a callback per record. Its documented contract has three outcomes ([`:5`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L5)–[`:10`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L10)): return a value to update, `null` to delete, and — [`:9`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L9) — "If nothing (void/undefined) is returned, entry is left untouched."

The helper honours that third case already ([`:24`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L24)–[`:28`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L28)). The callers do not use it. Three examples over the `txs` store, which is the largest store Suite persists:

- [`packages/suite/src/storage/migrations/versions/26.2.0.ts:9`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/versions/26.2.0.ts#L9) — deletes rows of token-capable networks, then [`:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/versions/26.2.0.ts#L14) `return transaction;` re-puts every other row unchanged.
- [`packages/suite/src/storage/migrations/networks/removeNetwork.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/networks/removeNetwork.ts#L12) — deletes rows of the removed symbol, then [`:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/networks/removeNetwork.ts#L17) `return tx;` re-puts every other row unchanged. Called from [`25.11.0.1.ts:27`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/versions/25.11.0.1.ts#L27) and [`26.1.0.ts:9`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/versions/26.1.0.ts#L9).
- [`packages/suite/src/storage/migrations/index.ts:953`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L953) — rewrites `matic` rows to `pol`, then [`:959`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L959) `return tx;` re-puts every other row unchanged.

All of this runs inside the `versionchange` transaction opened by `openDB` ([`packages/suite-storage/src/index.ts:96`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L96)), driven by [`packages/suite/src/storage/index.ts:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/index.ts#L63)–[`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/index.ts#L67), which `preloadStore` awaits via `db.getDB()` ([`packages/suite/src/support/suite/preloadStore.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L15)) before the store exists and the app renders ([`packages/suite-web/src/MainWeb.tsx:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-web/src/MainWeb.tsx#L59), [`packages/suite-desktop-ui/src/MainDesktop.tsx:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L67)).

## Before

`packages/suite/src/storage/migrations/utils.ts:19`–`:31` — the helper, which needs no change:

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

`packages/suite/src/storage/migrations/versions/26.2.0.ts:8`–`:24` — a caller that does:

```ts
export default createMigration<SuiteDBSchema>('26.2.0', async (_, tx) => {
    await updateAll(tx, 'txs', transaction => {
        if (getNetwork(transaction.tx.symbol).features.includes('tokens')) {
            return null;
        }

        return transaction;
    });

    await updateAll(tx, 'accounts', account => {
        if (getNetwork(account.symbol).features.includes('tokens')) {
            account.history = { total: 0, unconfirmed: 0, tokens: 0 };
        }

        return account;
    });
});
```

## After

```ts
export default createMigration<SuiteDBSchema>('26.2.0', async (_, tx) => {
    await updateAll(tx, 'txs', transaction => {
        if (getNetwork(transaction.tx.symbol).features.includes('tokens')) {
            return null;
        }
    });

    await updateAll(tx, 'accounts', account => {
        if (getNetwork(account.symbol).features.includes('tokens')) {
            account.history = { total: 0, unconfirmed: 0, tokens: 0 };

            return account;
        }
    });
});
```

Two different edits, and the difference matters. The `txs` callback never touches the record, so dropping `return transaction;` is enough. The `accounts` callback mutates `account.history` in place, so its `return account;` has to move _inside_ the `if` — the row is only written when it was actually modified.

That second shape is not invented for this issue; it is already the idiom two files over, at [`packages/suite/src/storage/migrations/legacyVersions/migrateToV56.ts:201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/legacyVersions/migrateToV56.ts#L201)–[`:207`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/legacyVersions/migrateToV56.ts#L207), which mutates and returns inside the `if` and falls off the end otherwise.

## Why it matters

The user has just updated Suite and is looking at `LoadingScreen` ([`MainWeb.tsx:57`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-web/src/MainWeb.tsx#L57)) while the migration runs. Nothing else can proceed: `preloadStore` awaits the open, the composition root is built from its result, and the real app tree does not mount until it resolves. The `versionchange` transaction also holds the database exclusively, so a second Suite tab is blocked for the same interval ([`packages/suite-storage/src/index.ts:100`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L100)–[`:117`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L117)).

`n` is the row count of `txs` — one row per persisted transaction, keyed by `['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type']` ([`migrations/index.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L56)–[`:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L58)), summed over every remembered wallet. It grows monotonically with the user's history and with how many devices they have remembered; nothing prunes it.

Per unchanged row the current code pays a structured-clone serialize of the record, a write, an update of all five `txs` indexes ([`:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L59)–[`:65`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/index.ts#L65)), and one extra awaited round trip through the IDB task source — to store exactly the bytes that were already there. And it pays it once per walk: the `txs` store is walked twelve times in `migrations/index.ts`, once in `networks/bnb.ts`, once in `legacyVersions/migrateToV56.ts` (all of those only for installs older than version 57 — [`storage/index.ts:11`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/index.ts#L11), [`:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/index.ts#L63)), once in `26.2.0`, and once per `removeNetwork` call. A bitcoin-only wallet crossing `25.11.0.1` → `26.1.0` → `26.2.0` therefore rewrites its whole transaction history three times without changing a single byte.

After the fix, a wallet with no affected rows pays one cursor step per row per walk and zero writes. The rows that genuinely change cost exactly what they cost today. Nothing the user sees changes: the migration still runs to completion behind the same loading screen before the app mounts, it just stops doing the writes that had no effect.

## Notes

- **The IDB semantics trap, which decides whether the skill's usual fix is even legal here — it is not.** `idb`'s own README ("Transaction lifetime") states that an IDB transaction auto-closes once microtasks have been processed and nothing is left pending. `await yieldToMain()` — `scheduler.yield()` or `setTimeout(resolve, 0)` alike — is a macrotask boundary, so inserting one into this cursor walk would let the `versionchange` transaction commit early. The next `cursor.continue()` would then throw `TransactionInactiveError`, and it would fail _silently_: `packages/suite-storage/src/index.ts:96`–`:99` calls `this.onUpgrade(...)` without awaiting or returning its promise, and `idb`'s `openDB` ignores the `upgrade` callback's return value, so the rejection escapes as an unhandled rejection while the database version has already been bumped and the app boots on half-migrated data that will never be migrated again. This repo has already been bitten by exactly this interleaving, in tests — see the comment at [`suite-common/test-utils/globalOverrides/index.ts:8`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/test-utils/globalOverrides/index.ts#L8)–[`:25`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/test-utils/globalOverrides/index.ts#L25), which pins native `setImmediate` precisely so `_start()` does not run before user code enqueues the next request. **Do not propose yielding inside a migration.** The only lever is less work inside the transaction.
- Related, and the honest caveat on the framing: this walk is not one long task either. Each `await` resolves off an IDB event, so the main thread is free between records and the loading screen keeps painting. This is startup _serialisation_ — a chain of round trips in front of first render — not a 50 ms blocking period. A reviewer who reads the scheduling skill strictly as "long tasks and idle callbacks" can reasonably say this belongs in the complexity sweep instead; that is a fair rejection and I would not argue hard against it.
- `updateAll` itself is unchanged. The `undefined` branch already exists and is already documented. The obvious misreading of this issue is "add a skip-if-unchanged path to the helper" — it is there; what is missing is callers using it.
- **Retrofitting migrations that have already shipped.** Per `skills/idb-migrations/SKILL.md`, a migration that already ran must never change its end state. Skipping the write of a record the callback did not modify leaves byte-identical stored data, so this is not a behaviour change and needs no version bump and no new migration. But that argument only holds record by record: `cursor.value` is a fresh structured-clone copy, so a callback that mutates it and then returns `undefined` throws the mutation away. Each caller must be converted individually to "mutate and return, or return nothing and do not mutate". A blanket find-and-replace over the `return x;` lines would corrupt data — `26.2.0.ts:19` and `migrations/index.ts:955`–`:957` both mutate in place.
- If a reviewer disagrees with the retrofit argument and wants shipped migrations left strictly alone, the rule applies to new migrations only and the win shrinks to future versions. In that case the ordering changes: fix `removeNetwork.ts` first anyway, since it is a shared helper that future `removeNetwork(tx, …)` calls will keep re-running, and it has the widest reach of the three (everyone crossing `25.11.0.1` and `26.1.0`). `migrations/index.ts` is the least valuable target — it only runs for installs older than version 57, a shrinking population.
- Deliberately not changed: the `await` in front of `cursor.update(newObj)` / `cursor.delete()` at [`utils.ts:25`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L25) and [`:27`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L27). Issuing the request without awaiting it and awaiting the collected promises after the walk would remove a round trip for rows that do change, but it leaves an unbounded number of in-flight write requests queued against one transaction and a rejection escapes the walk unless every promise is collected. That is a change to the helper with its own failure mode; it should be argued separately.
- Also deliberately not changed: fusing the sixteen-odd separate `txs` walks into a single pass. That is the larger win and a much larger change — it means reordering the migration set itself, which fights the per-version migration model the repo just moved to.
- Tests: there is no test for `26.2.0` and none for `removeNetwork`. `packages/suite/src/storage/migrations/versions/` has tests only for `25.10.0`, `25.11.0`, `26.4.0.1`, `26.5.0.1`, `26.6.0`, `26.6.0.1`, `26.7.0.2`, `26.8.0`, `26.8.0.1`, `26.8.0.2`. Any retrofit should land with one in the shape of `26.6.0.test.ts` — seed rows, run the migration, assert the untouched rows come back deep-equal and the deleted ones are gone. `fake-indexeddb` models the auto-commit behaviour, so such a test would also catch an accidental yield.
- The `After` has not been compiled or run. It type-checks by inspection: `updateAll`'s callback is typed `=> StoreValue<…> | null | void` ([`utils.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/storage/migrations/utils.ts#L17)), and the repo sets neither `noImplicitReturns` (`tsconfig.base.json`) nor an ESLint `consistent-return` rule, so falling off the end of the callback is accepted — as `migrateToV56.ts:201` already demonstrates.
- Web and desktop only. No published-package impact: `packages/suite` is an app, and `@trezor/suite-storage` is not touched. suite-native does not use this storage layer.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
