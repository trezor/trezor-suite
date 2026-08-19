# Coinjoin `scanAccount` rescans every transaction of a matching block per derived address — build a per-block address index

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/coinjoin/src/backend/scanAccount.ts:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L59) (also 58, 60, 61) — `scanAccount (addresses.analyze getTxs callback)`

`addresses` = the account's receive+change list, which `CoinjoinAddressController.analyzeType` grows in-place while iterating; `block.txs` = every transaction in the fetched block (paged at 1000 per request in `CoinjoinBackendClient.fetchBlock`, so up to ~3000-4000 for a full block)

## Before

```ts
    const block = await client.fetchBlock(blockHeight, { signal: abortSignal });
    if (mempool?.status === 'running') {
        mempool.removeTransactions(block.txs.map(({ txid }) => txid));
    }
    addresses.analyze(
        ({ address }) => block.txs.filter(doesTxContainAddress(address)),
        transactions => transactions.forEach(txs.add, txs),
    );
}

const transactions = Array.from(txs, transformTx(addresses));
checkpoint = {
    blockHash,
    blockHeight,
```

## After

Build the index once per matching block, before `analyze`: iterate `block.txs` and for each vin/vout address push the tx into `Map<string, BlockbookTransaction[]>`, then pass `({ address }) => txsByAddress.get(address) ?? []` as `getTxs`. One pass over the block replaces `addresses.length` passes.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(A x B) doesTxContainAddress calls per matching block, each O(k) after candidate #2 is fixed (O(k^2) today) — A = derived addresses, B = block.txs.length`** — warm path.

`CoinjoinAddressController.analyzeType` (CoinjoinAddressController.ts:79-90) invokes the `getTxs` callback once per derived address, and the callback re-filters the entire `block.txs` array each time, paying the O(k^2) `getAllTxAddresses` dedup per (address, tx) pair. The block's transaction list is fixed for the duration of `analyze`, so the address->txs mapping is computable once. This runs for every block whose BIP158 filter matches — every block containing one of the account's coinjoin rounds, plus every filter false positive — during `CoinjoinBackend.scanAccount`, which suite drives from `suite/coinjoin/src/coinjoinAccountActions.ts` on discovery and on every subsequent sync.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Non-obvious constraint on the fix: analyzeType MUTATES `derived` while iterating (line 87 pushes newly derived addresses), so addresses looked up in the index are not known before analyze starts. That is fine — a `Map<string, BlockbookTransaction[]>` built from block.txs covers any address, and `.get(address) ?? []` handles the newly derived ones that have no txs. Order must be preserved: iterate block.txs in order and push, because `transactions.forEach(txs.add, txs)` feeds a Set whose insertion order determines the order of `Array.from(txs, transformTx(addresses))` at line 64 and therefore the transactions handed to onProgress. Also dedupe per (tx, address) when building the map — today getAllTxAddresses's arrayDistinct means a tx matching an address in both vin and vout is returned once by the filter, and Set.add would mask a double push here but the per-address txs.length check at CoinjoinAddressController.ts:83 would not. Same PR should touch candidate #2, since fixing that alone already removes the k^2 factor here.

- Spans more than one file — see also `packages/coinjoin/src/backend/CoinjoinAddressController.ts:79`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
