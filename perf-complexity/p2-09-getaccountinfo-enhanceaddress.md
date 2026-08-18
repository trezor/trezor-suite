# Coinjoin `enhanceAddress` rescans the whole transaction history once per derived address — index the addresses before the loop

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/coinjoin/src/backend/getAccountInfo.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/getAccountInfo.ts#L44) (also 45, 46, 85, 86) — `enhanceAddress (called from getAccountInfo)`

`addressController.receive` + `.change` (every derived address of the coinjoin account) x `txsConfirmed` (the account's whole confirmed history) x the vin+vout address list of each transaction

## Before

```ts
const enhanceAddress =
    (transactions: Transaction[]) =>
    ({ address, path }: PrederivedAddress): Address => {
        const txs = transactions.filter(tx => doesTxContainAddress(address)(tx.details));
        const sent = sumAddressValues(txs, address, tx => tx.details.vin);
        const received = sumAddressValues(txs, address, tx => tx.details.vout);

        return {
            address,
            path,
            transfers: txs.length,
            balance: txs.length ? (received - sent).toString() : '0',
```

## After

Index once, above the address loop: walk `txsConfirmed` a single time building `Map<address, Transaction[]>` from each tx's vin/vout addresses (O(T x k)), then `enhanceAddress` becomes `const txs = byAddress.get(address) ?? []`. Same map can feed `sumAddressValues`, or fold the sent/received sums into the same single pass so vin/vout are visited once in total instead of once per address.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(A x T) calls to doesTxContainAddress, each O(k) (or O(k^2) until candidate #2 is fixed) — A = receive+change addresses, T = confirmed txs, k = vin+vout addresses of one tx`** — hot path.

`enhanceAddress(txsConfirmed)` is mapped over EVERY derived address at lines 85-86, and for each address it re-walks the entire transaction array. Both dimensions grow with the account: `DISCOVERY_LOOKOUT_EXTENDED = 50` change addresses past the last used one, and each coinjoin round consumes up to `ROUND_SELECTION_MAX_OUTPUTS = 20` change addresses, so a few dozen rounds put the address count in the high hundreds; transactions are the full history (one tx per round plus normal history). Worse, the inner `doesTxContainAddress` -> `getAllTxAddresses` allocates concat+flatMap arrays and runs an O(k^2) `arrayDistinct` dedup for every (address, tx) pair, where k is the vin+vout address count of a WabiSabi coinjoin tx (hundreds). Entry points: `suite/coinjoin/src/coinjoinAccountActions.ts:499` (every account sync / new block) and `:366` `updatePendingAccountInfo` (after every completed round and every send-form broadcast), both via `CoinjoinBackend.getAccountInfo`.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Overlaps deliberately with candidate #2 (backendUtils.ts:18): fixing #2 alone drops the k^2 factor and leaves O(A x T); fixing this one alone drops A x T and leaves O(T x k^2). Both are worth filing but they should cross-reference each other in the issue. Behaviour deltas to watch when indexing: (a) the current filter preserves `txsConfirmed` order, so build the Map by iterating txsConfirmed in order and pushing — do NOT build it from a Set keyed by tx object or the `transfers` count / sortTxsFromLatest-independent ordering can shift; (b) a tx that contains the same address in both vin and vout must be pushed ONCE per address (today the arrayDistinct dedup inside getAllTxAddresses guarantees a single match), so dedupe per-tx when inserting, otherwise `transfers: txs.length` double-counts and `sumAddressValues` is called twice on the same tx; (c) `sumAddressValues` comes from @trezor/blockchain-link and takes the tx array, so it can consume the map value unchanged. Companion: `doesTxContainAddress` import at line 6 becomes unused if the index replaces it entirely. Verified entry points: suite/coinjoin/src/coinjoinAccountActions.ts:366 (updatePendingAccountInfo, after each prepending tx / round) and :499 (inside fetchAndUpdateAccount, per sync).

- Spans more than one file — see also `packages/coinjoin/src/backend/backendUtils.ts:28`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
