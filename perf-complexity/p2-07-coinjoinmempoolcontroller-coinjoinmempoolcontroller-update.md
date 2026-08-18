# `CoinjoinMempoolController.update` purges with an `Array.includes` scan per retained transaction — O(m²) on every account sync

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. The purge already has the fresh txid list in hand; it just never keys it, and instead re-scans it linearly once per entry of a map that the blockbook mempool firehose fills unboundedly between purges.

## Where

[`packages/coinjoin/src/backend/CoinjoinMempoolController.ts:188`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L188)

`update()` drops every locally-retained mempool transaction that the server no longer lists. The membership test against the server's list is `keepTxids.includes(txid)` — a full array scan — evaluated inside a `.filter` over all retained txids, so the cost is the product of two quantities that are both the size of the retained mempool.

## Before

`packages/coinjoin/src/backend/CoinjoinMempoolController.ts:179-193`:

```ts
    async update(force?: boolean) {
        const now = new Date().getTime();
        if (now - this.lastPurge < MEMPOOL_PURGE_CYCLE && !force) return;

        const mempoolTxids = await this.client
            .fetchMempoolFilters()
            .then(({ entries }) => Object.keys(entries));
        const keepTxids = mempoolTxids.filter(txid => this.mempool.has(txid));
        const removeTxids = Array.from(this.mempool.keys()).filter(
            txid => !keepTxids.includes(txid),
        );
        removeTxids.forEach(this.onTxRemove);

        this.lastPurge = now;
    }
```

## After

```ts
    async update(force?: boolean) {
        const now = new Date().getTime();
        if (now - this.lastPurge < MEMPOOL_PURGE_CYCLE && !force) return;

        const mempoolTxids = await this.client
            .fetchMempoolFilters()
            .then(({ entries }) => Object.keys(entries));
        const keepTxids = new Set(mempoolTxids.filter(txid => this.mempool.has(txid)));
        const removeTxids = Array.from(this.mempool.keys()).filter(txid => !keepTxids.has(txid));
        removeTxids.forEach(this.onTxRemove);

        this.lastPurge = now;
    }
```

Two words of diff: `keepTxids` becomes a `Set` and `.includes` becomes `.has`. Everything else — the `Array.from(this.mempool.keys())` materialisation, the ordering, the `forEach(this.onTxRemove)` — stays exactly as it is.

## Why it matters

O(m × |keepTxids|), and since `keepTxids` is itself derived by filtering the server list _down to keys of the same map_ (`mempoolTxids.filter(txid => this.mempool.has(txid))`), `|keepTxids|` approaches `m` whenever the local view is in sync. The steady state is therefore exactly quadratic: **O(m²) string comparisons, m = `this.mempool.size`**.

`m` is not the account's transaction count — it is the number of _global_ Bitcoin mempool transactions the controller has chosen to retain. `onTransactionAdd` ([`:57`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L57)) is subscribed to blockbook's `subscribeNewTransaction` firehose (`subscribeMempoolTxs` → [`CoinjoinBackendClient.ts:186`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackendClient.ts#L186) → `websocket.ts` `subscribeMempool`), and it stores any transaction with at least one address passing the controller's `filter`, which `CoinjoinBackend`'s constructor sets to `address => isTaprootAddress(address, this.network)` ([`CoinjoinBackend.ts:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackend.ts#L46)). Taproot is a large and growing share of mainnet traffic, so a substantial fraction of every transaction broadcast on the network is retained.

Nothing evicts those entries except `update()` itself, and `update()` only runs when an account sync happens to reach [`scanAccount.ts:91`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L91) _and_ `MEMPOOL_PURGE_CYCLE` (10 minutes, [`constants.ts:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L50)) has elapsed. Ten minutes of mainnet traffic is already thousands of retained entries; an idle-but-connected session that goes longer without a sync accumulates proportionally more, and the _first_ purge after that gap is the expensive one. At 10 000 entries that is ~10⁸ string comparisons in one uninterruptible loop on the coinjoin backend thread ([`suite-desktop-core/src/threads/coinjoin-backend.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/threads/coinjoin-backend.ts)), stalling the account sync that triggered it and every mempool notification queued behind it.

For scale on the identical defect shape — an `Array.includes` membership test inside a per-element loop, replaced by a `Set` — #31126 reports a _measured_ 167 ms → 1.7 ms at 5 000 UTXOs / 20 000 transactions. That is #31126's measurement of its own code path; nothing in this audit was benchmarked.

## Notes

- **Behaviour is bit-for-bit identical.** `Set.prototype.has` and `Array.prototype.includes` both use SameValueZero; txids are plain hex strings, so no `NaN`/`-0` edge cases. `keepTxids` has no other reader in the file, so narrowing its type from `string[]` to `Set<string>` is local.
- **Order of `removeTxids` must be preserved, and it is.** `.filter` over `Array.from(this.mempool.keys())` keeps Map insertion order, which matters because `onTransactionRemove` mutates `this.addressTxids` as it walks — it rebuilds each address record by filtering out the removed txid and deletes the key when the record empties.
- **Do not "optimise" away the `Array.from`.** Iterating `this.mempool.keys()` lazily into the `forEach` would mutate the Map during iteration, since `onTxRemove` calls `this.mempool.delete(txid)`. The array snapshot at line 187 is load-bearing.
- The audit's original proposal was `const liveTxids = new Set(mempoolTxids); const removeTxids = Array.from(this.mempool.keys()).filter(txid => !liveTxids.has(txid));`, dropping `keepTxids` entirely. That is equally correct — `keepTxids` is by construction a subset of the map's keys, so for a `txid` that _is_ a map key, `!keepTxids.includes(txid)` and `!mempoolTxids.includes(txid)` agree exactly. The form above is preferred only because the `Set` it builds is bounded by `this.mempool.size` rather than by the size of the server's entire mempool filter response, which `fetchMempoolFilters` returns unfiltered and which is typically far larger.
- **TypeScript:** `mempoolTxids` is `string[]` (`Object.keys` of `MempoolFilterResponse['entries']`), so `new Set(mempoolTxids.filter(...))` infers `Set<string>` and `.has(txid: string)` type-checks with no annotation. The package has `noUncheckedIndexedAccess` on (see the `@ts-expect-error` comments in the test file), but nothing here indexes.
- **Existing cover is good.** `packages/coinjoin/src/backend/CoinjoinMempoolController.test.ts` drives `update(true)` five times across the `All at once` and `Progressing` cases, asserting the exact surviving set after each purge — including the "server list contains txids we never had" case at [`:72`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.test.ts#L72) (`setMempoolTxs([TX0, TX1])` → everything removed) and the "server list is empty" case at [`:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.test.ts#L46). Those assertions pin the purge semantics; they should pass unchanged.
- **Sibling anchor in the same file.** [`:62`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L62) runs `.filter(arrayDistinct)` over `collidingTxids` inside `onTransactionAdd` — the same O(k²) dedup, on the per-transaction hot path rather than the per-purge one. It is a separate, marginal finding (k is the number of colliding txids), but `[...new Set(...)]` there is a trivial companion edit if this PR is already touching the file.
- **Related, land-together candidate.** `packages/coinjoin/src/backend/backendUtils.ts:18` (`getAllTxAddresses` / `doesAnyAddressFulfill`) is filed separately and is the other half of this controller's cost: `getAllTxAddresses` runs on _every_ transaction the firehose delivers, via `onTransactionAdd` at [`:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L58) and `onTransactionRemove` at [`:82`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L82). Both of those call sites genuinely need the dedup (duplicate addresses would push the same txid twice into an `addressTxids` record), so they must keep it — as a `Set`, not as `arrayDistinct`.
- No React or React Compiler surface: this is `@trezor/coinjoin` backend code running in the desktop coinjoin thread.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
