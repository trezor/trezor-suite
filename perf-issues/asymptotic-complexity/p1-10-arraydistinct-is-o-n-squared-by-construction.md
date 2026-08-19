# `arrayDistinct` is O(n²) by construction — it cannot be fixed in place, replace the call sites with `new Set`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `arrayDistinct` is `self.indexOf(item) === index` used as a `filter` predicate, so every element triggers a full linear scan of the array — the scan-inside-a-loop the rule names, hidden inside a `@trezor/utils` primitive with 12 live call sites. It is the second quadratic primitive in that package, alongside `arrayPartition` and the already-filed `arrayToDictionary` (#31122).

## Where

[`packages/utils/src/arrayDistinct.ts:4`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/arrayDistinct.ts#L4)

The helper deduplicates by asking, for each element, "is my own first occurrence at my index?". Answering that costs a scan, so `xs.filter(arrayDistinct)` is O(n²) comparisons for an operation that a `Set` does in O(n). Unlike `arrayPartition`, this one **cannot be repaired in place**: a `filter` predicate is handed `self` on every invocation and has nowhere to keep a seen-set — the only way to memoize it would be a `WeakMap` keyed on the array, which is worse than deleting the helper. The fix is therefore per call site, and the call sites differ by six orders of magnitude in `n`, so they need grading rather than a blind sweep.

## Before

### 1. The helper

```ts
/**
 * Helper function to filter only distinct elements of an array
 */
export const arrayDistinct = <T>(item: T, index: number, self: T[]) => self.indexOf(item) === index;
```

### 2. `addressManager.ts:22` — dedup of every address being subscribed

```ts
const addAddresses = (addresses: string[]) => {
    const toAdd = addresses.filter(arrayDistinct).filter(addr => !subscribedAddrs[addr]);
    const network = getNetwork();

    subscribedAddrs = toAdd.reduce<AddressMap>(
        (dic, addr) => ({
            ...dic,
            [addr]: addressToScripthash(addr, network),
        }),
        subscribedAddrs,
    );

    return toAdd.map(addr => subscribedAddrs[addr]).filter((addr): addr is string => !!addr);
};
```

### 3. `accountUtils.ts:372` — dedup of the addresses of one transaction, per transaction

```ts
const countAddressTransfers = (transactions: AccountTransaction[]) =>
    transactions
        .flatMap(tx =>
            tx.details.vin
                .concat(tx.details.vout)
                .flatMap(({ addresses }) => addresses ?? [])
                .filter(arrayDistinct),
        )
        .reduce(
            (transfers, address) => ({ ...transfers, [address]: (transfers[address] ?? 0) + 1 }),
            {} as { [address: string]: number },
        );
```

## After

### 1. The helper

Nothing replaces it. Mark it deprecated so no new call site appears while the existing ones are converted, then delete `packages/utils/src/arrayDistinct.ts` and `export * from './arrayDistinct';` ([`packages/utils/src/index.ts:8`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/index.ts#L8)) once the last one is gone.

```ts
/**
 * Helper function to filter only distinct elements of an array
 *
 * @deprecated O(n²) — as a `filter` predicate this runs a full `indexOf` scan per element.
 * Use `[...new Set(items)]`, which preserves first-occurrence order identically.
 */
export const arrayDistinct = <T>(item: T, index: number, self: T[]) => self.indexOf(item) === index;
```

### 2. `addressManager.ts:22`

```ts
const addAddresses = (addresses: string[]) => {
    const toAdd = [...new Set(addresses)].filter(addr => !subscribedAddrs[addr]);
    const network = getNetwork();

    subscribedAddrs = toAdd.reduce<AddressMap>(
        (dic, addr) => ({
            ...dic,
            [addr]: addressToScripthash(addr, network),
        }),
        subscribedAddrs,
    );

    return toAdd.map(addr => subscribedAddrs[addr]).filter((addr): addr is string => !!addr);
};
```

The `reduce` two lines below is the spread accumulator already filed as **#31129** and is deliberately left untouched here — see Notes.

### 3. `accountUtils.ts:372`

```ts
const countAddressTransfers = (transactions: AccountTransaction[]) => {
    const transfers: { [address: string]: number } = {};

    transactions.forEach(tx => {
        const txAddresses = new Set(
            tx.details.vin.concat(tx.details.vout).flatMap(({ addresses }) => addresses ?? []),
        );

        txAddresses.forEach(address => {
            transfers[address] = (transfers[address] ?? 0) + 1;
        });
    });

    return transfers;
};
```

This hunk folds in the spread-accumulator `reduce` on the next line, which is already filed as **#31131** — the two defects are one expression and cannot be separated cleanly.

## Call-site triage

12 live call sites (14 textual occurrences: one is inside the commented-out `listunspent` block at [`transaction.ts:120-144`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L120), one is in `packages/coinjoin/src/backend/methods.test.ts:40`). Severity varies enormously:

| Call site                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `n`                                                                               | Verdict                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`electrum/utils/transaction.ts:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L103), [`:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L115) (`:126` is dead code)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | full unpaginated account history / all its vins                                   | **Severe** — filed separately                                                                                       |
| [`coinjoin/backend/backendUtils.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/backendUtils.ts#L18)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | vin+vout addresses of one tx (hundreds for a WabiSabi coinjoin), called A×T times | **Severe** — filed separately                                                                                       |
| [`electrum/utils/addressManager.ts:22`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/addressManager.ts#L22)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | addresses being subscribed                                                        | **Real.** Sits two lines above the spread-reduce already filed as **#31129** — fold in there                        |
| [`wallet-utils/src/accountUtils.ts:372`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L372)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | addresses in one tx, inside a `flatMap` over the pending tx list                  | **Real** for coinjoin/batch txs. Sits two lines above the spread-reduce already filed as **#31131** — fold in there |
| [`CoinjoinMempoolController.ts:62`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L62)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | colliding txids per address                                                       | Marginal — grows with mempool collisions; convert opportunistically                                                 |
| [`blockchainThunks.ts:214`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L214), [`:236`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L236), [`DeviceList.ts:257`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/DeviceList.ts#L257), [`CoinjoinRound.ts:139`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/CoinjoinRound.ts#L139), [`:240`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/CoinjoinRound.ts#L240), [`coinjoinMiddleware.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinMiddleware.ts#L92), [`coinjoinClientActions.ts:373`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinClientActions.ts#L373) | symbols / identities / API types / round inputs                                   | **Bounded — leave alone.** Convert only when the helper is finally deleted                                          |

## Why it matters

O(n²) string comparisons per dedup, everywhere the helper is used, replaced by O(n) hashing.

The two severe sites are what make this a P1 rather than hygiene:

- `transaction.ts:103` dedups the txids of an account's **complete, unpaginated** electrum history. `getTransactions` is fed that history by [`methods/getAccountInfo.ts:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L143) and by [`methods/getAccountBalanceHistory.ts:110`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountBalanceHistory.ts#L110), where the histories of every receive and change address are concatenated **without** deduplication first — so `n` is the transaction count multiplied by the addresses each transaction touches. On a 5,000-transaction account that is `n` ≈ 10,000 at `:103` (~10⁸ comparisons) and larger again at `:115`, which dedups every vin txid of every fetched transaction.
- `backendUtils.ts:18` (`getAllTxAddresses`) dedups the vin+vout address list of a single transaction — hundreds of entries for a WabiSabi coinjoin — and is called once per (address, transaction) pair from [`coinjoin/backend/getAccountInfo.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/getAccountInfo.ts#L44) and [`scanAccount.ts:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L59), plus once per transaction pushed by the blockbook `subscribeNewTransaction` firehose while a coinjoin account is active. The k² factor multiplies an already-quadratic A×T walk.

The remaining sites are cheap today, but they are the reason the helper stays alive and keeps being copied into new code.

No number here is measured. For scale, #31122 reports 227 ms at n=2000 for the same complexity class in `arrayToDictionary` — that is that issue's measurement, on a different helper, not this one.

## Notes

- **The two "fold in" rows are the point of this issue.** `addressManager.ts:22` sits two lines above the spread-accumulator `reduce` filed as **#31129**, and `accountUtils.ts:372` sits two lines above the one filed as **#31131**. Whoever picks up those issues is already editing that exact function body — doing the dedup in the same PR avoids two PRs touching the same four lines and two rounds of review on the same function. Do **not** file these two as separate work.
- `[...new Set(xs)]` preserves **first-occurrence order** exactly as `filter(arrayDistinct)` does — `indexOf(item) === index` keeps the first occurrence, and `Set` iterates in insertion order. Every converted call site is behaviour-identical. No call site uses the predicate's `index` or `self` arguments for anything but the dedup.
- No call site relies on referential identity of the returned array either — both forms allocate a fresh array.
- `tsconfig.base.json` sets `"target": "ES2023"`, so spreading a `Set` needs no `downlevelIteration`; the `Set` iterable overload of the spread is available in every workspace.
- `noUnusedLocals: true` is on repo-wide, so **each converted file must drop `arrayDistinct` from its import list in the same edit** or type-check fails. In `backendUtils.ts` and `CoinjoinMempoolController.ts` it is the only (respectively, one of three) named import from `@trezor/utils`.
- `noUncheckedIndexedAccess: true` is on: in the `countAddressTransfers` rewrite, `transfers[address]` reads as `number | undefined`, which the existing `?? 0` already handles; the explicit `const transfers: { [address: string]: number }` annotation replaces the `as {...}` cast that the `reduce` seed carried and is required, otherwise the object literal widens to `{}`.
- `packages/utils` is published (`@trezor/utils`, currently `10.0.0-beta.1`). Removing the export is a public API removal — the deprecation JSDoc above is the intermediate step; the deletion belongs in the 10.0.0 release rather than in a patch.
- **Test coverage.** There is no `packages/utils/src/arrayDistinct.test.ts`, so the helper itself is untested — the deprecation/deletion needs no test change. `countAddressTransfers` is covered indirectly by [`suite-common/wallet-utils/src/accountUtils.test.ts:428`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.test.ts#L428) (_"enhanceAddresses: count transfers from pending txs"_), which must keep passing unchanged. `addressManager` has no unit test; `packages/blockchain-link/src/workers/state.test.ts` exercises a different `addAddresses`. `packages/coinjoin/src/backend/methods.test.ts:40` uses `arrayDistinct` in test scaffolding — convert it last, when the export is deleted.
- The `transaction.ts` conversion should land in the **same PR** as that file's `arrayToDictionary` calls at `:110` and `:118`, which are already filed under #28886 — same function body.
- The `backendUtils.ts:18` conversion interacts with two other filed items: `getAllTxAddresses` is consumed both as a membership test (via `doesAnyAddressFulfill`/`doesTxContainAddress`) and as a genuine distinct-address list (`CoinjoinMempoolController.onTransactionAdd`/`onTransactionRemove`). Only the latter needs the dedup at all; the former should short-circuit without materializing a list. Keep the dedup for the mempool controller.
- React Compiler is irrelevant here — every call site is in worker, thunk, or backend code, not in a component. Hermes is only reached via `accountUtils.ts`; `new Set` and `Set.prototype.forEach` are fine there (no `toSorted`-style gap).
- The sibling `arrayPartition` issue fixes the other quadratic `@trezor/utils` primitive. That one _is_ repairable in place, so the two issues share a motivation but not a diff shape.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
