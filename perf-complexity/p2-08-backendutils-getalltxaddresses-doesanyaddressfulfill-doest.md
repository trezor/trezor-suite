# `doesTxContainAddress` pays an O(k²) `arrayDistinct` dedup it immediately throws away — short-circuit the membership test, dedup with a `Set`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `arrayDistinct` is `self.indexOf(item) === index`, a full linear scan per element, so `getAllTxAddresses` is quadratic in the transaction's address count; the only consumer on the hot path is a `.some(addr => addr === address)` membership test that cannot observe duplicates at all.

## Where

[`packages/coinjoin/src/backend/backendUtils.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/backendUtils.ts#L18) — the `.filter(arrayDistinct)` on `getAllTxAddresses`, plus the two helpers stacked on it at [`:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/backendUtils.ts#L20) (`doesAnyAddressFulfill`) and [`:28`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/backendUtils.ts#L28) (`doesTxContainAddress`).

`getAllTxAddresses` serves two unrelated jobs through one implementation: "list this transaction's distinct addresses" (`CoinjoinMempoolController`, which genuinely needs the dedup) and "does this transaction touch address X?" (`doesTxContainAddress`, which does not). The second job is the one on the hot path, and it pays for the first job's dedup — concat, flatMap, an O(k²) `indexOf` sweep and three intermediate arrays — before answering a question a single short-circuiting `.some` could answer without allocating anything.

## Before

`packages/coinjoin/src/backend/backendUtils.ts:1-29`:

```ts
import { arrayDistinct } from '@trezor/utils';
import {
    type Network,
    address as btcAddress,
    deriveAddresses as deriveNewAddresses,
} from '@trezor/utxo-lib';

import type { PrederivedAddress, VinVout } from '../types/backend';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

type VinVoutAddressTx = { vin: Pick<VinVout, 'addresses'>[]; vout: Pick<VinVout, 'addresses'>[] };

export const getAllTxAddresses = ({ vin, vout }: VinVoutAddressTx) =>
    vin
        .concat(vout)
        .flatMap(({ addresses = [] }) => addresses)
        .filter(arrayDistinct);

const doesAnyAddressFulfill = (
    { vin, vout }: VinVoutAddressTx,
    condition: (address: string) => boolean,
) => getAllTxAddresses({ vin, vout }).some(condition);

export const isTaprootAddress = (address: string, network: Network) =>
    btcAddress.getAddressType(address, network) === 'p2tr';

export const doesTxContainAddress = (address: string) => (tx: VinVoutAddressTx) =>
    doesAnyAddressFulfill(tx, addr => addr === address);
```

The two callers that matter. `packages/coinjoin/src/backend/getAccountInfo.ts:44` — once per (derived address × confirmed transaction):

```ts
const txs = transactions.filter(tx => doesTxContainAddress(address)(tx.details));
```

`packages/coinjoin/src/backend/scanAccount.ts:58-61` — once per (derived address × transaction in a matching block):

```ts
addresses.analyze(
    ({ address }) => block.txs.filter(doesTxContainAddress(address)),
    transactions => transactions.forEach(txs.add, txs),
);
```

## After

Split the two use cases. `packages/coinjoin/src/backend/backendUtils.ts:1-29`:

```ts
import {
    type Network,
    address as btcAddress,
    deriveAddresses as deriveNewAddresses,
} from '@trezor/utxo-lib';

import type { PrederivedAddress, VinVout } from '../types/backend';

export const isTxConfirmed = ({ blockHeight = -1 }: { blockHeight?: number }) => blockHeight > 0;

type VinVoutAddressTx = { vin: Pick<VinVout, 'addresses'>[]; vout: Pick<VinVout, 'addresses'>[] };

export const getAllTxAddresses = ({ vin, vout }: VinVoutAddressTx) => [
    ...new Set(vin.concat(vout).flatMap(({ addresses = [] }) => addresses)),
];

export const isTaprootAddress = (address: string, network: Network) =>
    btcAddress.getAddressType(address, network) === 'p2tr';

// membership test: short-circuits on the first hit, allocates nothing
export const doesTxContainAddress =
    (address: string) =>
    ({ vin, vout }: VinVoutAddressTx) =>
        vin.some(({ addresses }) => addresses?.includes(address)) ||
        vout.some(({ addresses }) => addresses?.includes(address));
```

`doesAnyAddressFulfill` loses its only caller and is deleted with it; it is module-private (never exported), so nothing outside the file can reference it. The `arrayDistinct` import on line 1 is the file's only import from `@trezor/utils` and goes with it — `noUnusedLocals` is on repo-wide, so dropping it is mandatory in the same edit, not optional tidying.

No caller changes. `getAllTxAddresses` keeps its exact signature and return type (`string[]`), so `CoinjoinMempoolController.ts:58` and `:82` are untouched and keep their dedup, now at O(k).

## Why it matters

The dedup is **O(k²) string comparisons per call**, where **k is the vin + vout address count of a single transaction**. For an ordinary payment k is 2–5 and this is invisible. For a WabiSabi coinjoin transaction — the entire point of this package — k is in the hundreds: every round mixes dozens of participants' inputs into dozens of outputs, and `packages/coinjoin/src/constants.ts:34` alone allows `ROUND_SELECTION_MAX_OUTPUTS = 20` outputs _per participant_. At k = 400 that is 160 000 comparisons plus three array allocations, to answer one boolean.

That cost then sits inside two nested loops:

- [`getAccountInfo.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/getAccountInfo.ts#L44) calls it once per (address, transaction) pair — `enhanceAddress` is mapped over every derived address, and each one re-walks the whole confirmed-transaction array. `DISCOVERY_LOOKOUT_EXTENDED = 50` change addresses past the last used one, plus up to 20 change addresses consumed per completed round, puts A in the high hundreds on an account that has mixed for a while; T is the full history. Entry points are `suite/coinjoin/src/coinjoinAccountActions.ts:499` (every account sync / new block) and `:366` `updatePendingAccountInfo` (after every completed round and every send-form broadcast).
- [`scanAccount.ts:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L59) calls it once per (address, block-transaction) pair, for every block whose BIP158 filter matches — every block containing one of the account's rounds, plus every filter false positive.

So the total is O(A × T × k²) and O(A × B × k²) respectively, where only the k² factor is removed here; the A × T and A × B factors are filed separately (see Notes). It also runs once per transaction pushed by the blockbook `subscribeNewTransaction` firehose, via `CoinjoinMempoolController.onTransactionAdd` (`CoinjoinMempoolController.ts:58`) — i.e. for **every new transaction in the Bitcoin mempool** while a coinjoin account is active, since `CoinjoinBackend.ts:46` passes `filter: address => isTaprootAddress(...)` and a large share of current mempool traffic is taproot. That call site keeps needing a dedup, but it gets it in O(k) instead of O(k²).

All of this runs in the desktop coinjoin backend thread (`packages/suite-desktop-core/src/threads/coinjoin-backend.ts`), so it does not block the renderer — but it does stall account sync and round participation, which are time-sensitive.

## Notes

- **The membership rewrite is exactly equivalent, including the empty/absent-`addresses` case.** Today `addresses = []` defaults a missing `addresses` to an empty array, which contributes nothing to the flatMap and therefore never matches. `addresses?.includes(address)` yields `undefined` for the same input, which is falsy — same result. `VinVout.addresses` is `string[] | undefined` (`packages/blockchain-link-types/src/common.ts:40`) and coinbase vins arrive without it, so the optional chain is load-bearing.
- **Duplicates never mattered to the membership test.** `.some(addr => addr === address)` returns the same boolean whether the list is deduped or not; the dedup was pure waste on that path. It also short-circuits earlier now: `vin.some(...)` stops at the first hit instead of building the full concat+flatMap list first.
- **Keep the dedup in `getAllTxAddresses` — the mempool controller depends on it.** `CoinjoinMempoolController.onTransactionAdd` (`:58`) feeds `filteredAddresses` into `this.addressTxids`, pushing `tx.txid` once per address; a duplicate address would push the same txid twice into one record, and `onTransactionRemove` (`:82`) filters by value so it would only remove one copy. `[...new Set(xs)]` preserves first-occurrence order **identically** to `filter(arrayDistinct)`, so both call sites are byte-for-byte unaffected.
- **`doesAnyAddressFulfill` should be deleted, not left behind.** It is `const`, not exported, and `doesTxContainAddress` is its only caller; leaving it in place trips `noUnusedLocals`. Same for the `arrayDistinct` import.
- Adjacent, deliberately out of scope: `CoinjoinMempoolController.ts:62` also uses `arrayDistinct`, on `collidingTxids`. Its `n` is the number of mempool txids colliding on one address, normally tiny. Converting it to `[...new Set(...)]` in the same PR is free and removes the file's last `arrayDistinct` use, but it is not the reason to open this issue.
- **TypeScript.** `new Set(string[])` gives `Set<string>`, and the spread back into an array gives `string[]` — `getAllTxAddresses`'s inferred return type is unchanged, so no declaration in `packages/coinjoin` shifts. `Array.prototype.some` accepts a predicate returning `unknown`, so `boolean | undefined` from the optional chain type-checks without a `!!`. `noUncheckedIndexedAccess` is on in this package (see the `@ts-expect-error` at `backendUtils.test.ts:11`) but nothing here indexes by number. `downlevelIteration` / target: `[...new Set(...)]` already appears elsewhere in the repo's package builds, and this is Node-side code, so no transpilation caveat applies.
- **Test cover.** `packages/coinjoin/src/backend/backendUtils.test.ts:56-63` covers `doesTxContainAddress` in both directions, and its `NON_TAPROOT_TX` fixture deliberately includes a vin with no `addresses` key at all (`{}`) and one with `addresses: []` — precisely the cases the optional chain has to keep handling. Those two tests must pass unchanged. There is **no direct test for `getAllTxAddresses`**; `packages/coinjoin/src/backend/methods.test.ts` exercises the mempool controller path indirectly and also uses `arrayDistinct` in its own scaffolding (leave that one alone). Worth adding a `getAllTxAddresses` case that asserts first-occurrence order on a tx whose address appears in both vin and vout.
- No React or React Compiler surface — this is backend-thread code in `@trezor/coinjoin`, and `backendUtils` is not re-exported from `packages/coinjoin/src/index.ts`, so the whole change is package-internal with no public-API or changeset implications.
- **Sequence with the two callers.** This is one of three overlapping coinjoin findings and it is the prerequisite for the other two: fixing this alone drops the k² factor and leaves `getAccountInfo.ts:44` at O(A × T) and `scanAccount.ts:59` at O(A × B); fixing those alone (index `Map<address, tx[]>` built once) leaves the k² factor in place wherever `doesTxContainAddress` survives. If those two are indexed away entirely, `doesTxContainAddress` loses both of its non-test callers and the import at `getAccountInfo.ts:6` / `scanAccount.ts:5` becomes unused — worth landing all three in one PR. Also related: `packages/utils/src/arrayDistinct.ts:4` is filed separately as the repo-wide helper triage, which grades this call site **Severe**; `CoinjoinMempoolController.ts:188` is a separate quadratic in the same directory.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
