# `getTransactions` dedups a whole account history with `arrayDistinct` — two O(n²) scans before the first `transaction.get`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `arrayDistinct` is `self.indexOf(item) === index` used as a `filter` predicate, so each `.filter(arrayDistinct)` runs a full linear scan per element; `getTransactions` does that twice, on the two largest arrays the electrum worker ever handles.

## Where

[`packages/blockchain-link/src/workers/electrum/utils/transaction.ts:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L103)
[`packages/blockchain-link/src/workers/electrum/utils/transaction.ts:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L115)

`getTransactions` takes the account's full, unpaginated electrum history and turns it into `BlockbookTransaction[]`. Line 103 deduplicates the txids of that history, line 115 deduplicates the vin txids of every transaction it just fetched. Both dedups are the right operation and the wrong data structure: a `Set` does each in O(n), `arrayDistinct` does each in O(n²). Both run synchronously on the worker thread before the corresponding `blockchain.transaction.get` batch is issued, so the cost is pure added latency on the account-info path.

## Before

```ts
export const getTransactions = async (
    client: ElectrumAPI,
    history: HistoryTx[],
): Promise<BlockbookTransaction[]> => {
    const txids = history.map(({ tx_hash }) => tx_hash).filter(arrayDistinct);

    // TODO optimize blockchain.transaction.get to not use verbose mode but parse
    // binary data locally instead. Then the transaction could be cached indefinitely.

    const origTxs = await Promise.all(
        txids.map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));

    const prevTxs = await Promise.all(
        Object.values(origTxs)
            .flatMap(({ vin }) => vin.filter(isNotCoinbase).map(({ txid }) => txid))
            .filter(arrayDistinct)
            .filter(txid => !origTxs[txid])
            .map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));
```

## After

```ts
export const getTransactions = async (
    client: ElectrumAPI,
    history: HistoryTx[],
): Promise<BlockbookTransaction[]> => {
    const txids = [...new Set(history.map(({ tx_hash }) => tx_hash))];

    // TODO optimize blockchain.transaction.get to not use verbose mode but parse
    // binary data locally instead. Then the transaction could be cached indefinitely.

    const origTxs = await Promise.all(
        txids.map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));

    const prevTxids = new Set(
        Object.values(origTxs).flatMap(({ vin }) =>
            vin.filter(isNotCoinbase).map(({ txid }) => txid),
        ),
    );

    const prevTxs = await Promise.all(
        [...prevTxids]
            .filter(txid => !origTxs[txid])
            .map(txid => client.request('blockchain.transaction.get', txid, true)),
    ).then(txs => arrayToDictionary(txs, ({ txid }) => txid));
```

The import at `:7` loses one name:

```ts
import { arrayToDictionary } from '@trezor/utils';
```

## Why it matters

O(n²) string comparisons at `:103` where `n` is the number of history entries, and O(m²) at `:115` where `m` is the total vin count across every fetched transaction — roughly 2–3× the transaction count for ordinary BTC spending, far more for consolidations.

`n` is the account's **entire** history, not a page. Two entry points feed it:

- [`methods/getAccountBalanceHistory.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountBalanceHistory.ts#L116) — the xpub branch at `:110-113` builds `history` by concatenating the per-address histories of every receive and change address and calling `.flat()`, with **no** dedup. A transaction touching four of the account's addresses appears four times, so `n` is the transaction count multiplied by the average addresses per transaction. For a 5,000-transaction account that is `n` ≈ 10,000–20,000, i.e. 10⁸–4·10⁸ comparisons at `:103` alone.
- [`methods/getAccountInfo.ts:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L143) — here `history` is _already_ deduplicated at `:122-124` (`new Map(...).values()` keyed on `tx_hash`), so `:103` finds nothing to remove. It still pays the full n² scan to discover that, on the account's whole history, on every account-info request with `details` in `tokenBalances | txids | txs`. The scripthash branch at `:91` is the same shape.

Both scans block the electrum worker thread, which is single-threaded and serializes every other electrum request behind them, and both run _before_ the network batch they gate — the delay is added on top of the round-trips, not overlapped with them.

Nothing here was measured. For scale on the same complexity class, #31122 reports 227 ms at n=2000 in `arrayToDictionary` — that is _that issue's_ number, on a different helper, not a benchmark of this code.

## Notes

- `[...new Set(xs)]` preserves **first-occurrence order** exactly as `filter(arrayDistinct)` does (`indexOf(item) === index` keeps the first occurrence; `Set` iterates in insertion order). The order of `txids` decides the order the `blockchain.transaction.get` requests are issued in, so this must not drift — and it does not.
- Downstream is order-insensitive anyway: both results go straight into `arrayToDictionary(txs, ({ txid }) => txid)`, keyed on the same txid that was deduplicated.
- **Companion edit, required:** with both call sites converted, `arrayDistinct` is no longer used in the file and `noUnusedLocals: true` (`tsconfig.base.json:11`) fails the build unless it is dropped from the import at `:7`. The third occurrence, `:126`, lives inside the `/* TODO ... */` block comment spanning `:120-:144` — it is dead code and does not keep the import alive, but whoever re-enables that `listunspent` block later has to convert it in the same breath.
- **Land with #31122.** `arrayToDictionary` is called on the very next lines (`:110` and `:118`) and its spread-accumulator `reduce` (`packages/utils/src/arrayToDictionary.ts:32`) is already filed — same function body, same four lines of diff. Two PRs here means two rounds of review on the same block.
- Also related: the repo-wide `arrayDistinct` sweep filed in this audit lists `transaction.ts:103` as one of its two severe sites. If that issue is taken first, this one is its `transaction.ts` half — close whichever lands second rather than duplicating the edit.
- The audit's original note claimed `getAccountInfo` inflates `n` by the address count. That is no longer true — `getAccountInfo.ts:122-124` deduplicates via a `Map` before calling. `getAccountBalanceHistory.ts:110-113` still does not, and is the path where the dedup at `:103` actually removes anything.
- `"target": "ES2023"`, so spreading a `Set` needs no `downlevelIteration`.
- `noUncheckedIndexedAccess: true` is on, but `.filter(txid => !origTxs[txid])` is a truthiness test and type-checks unchanged — it needs none of the `@ts-expect-error` escapes the file already carries at `:147` and `:150`.
- `prevTxids` is introduced as a named `Set` only to keep the chain readable; inlining `[...new Set(...)]` into the `Promise.all` argument is equivalent and type-checks identically. `new Set<string>` is inferred from `TxIn['txid']`, no annotation needed.
- **No unit test covers this.** The only exercise of `getTransactions` is [`packages/blockchain-link/src/workers/electrum/electrum.integration.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/electrum.integration.test.ts), which needs a live electrum server on `127.0.0.1:50001` and does not run in normal CI. A cheap regression guard would be a unit test on `getTransactions` with a stubbed `ElectrumAPI` asserting that a history containing repeated `tx_hash` values produces exactly one `blockchain.transaction.get` per distinct txid, in first-occurrence order.
- Worker code, no React and no Hermes involvement — no React Compiler or `toSorted`-style caveats apply.
- Out of scope but adjacent: the `TODO` at `:105-106` (fetch non-verbose and cache) is the change that would actually remove the network cost this function is dominated by. This issue only removes the CPU spent before that network cost.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
