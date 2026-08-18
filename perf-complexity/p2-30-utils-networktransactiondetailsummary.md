# `NetworkTransactionDetailSummary` uses ts-belt set operations with deep equality — O(n²) structural compares per transaction detail

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`suite-native/transactions/src/utils.ts:52`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/utils.ts#L52) (also 71) — `NetworkTransactionDetailSummary`

n = the entries of `transaction.details.vin` / `transaction.details.vout` for one transaction, mapped 1:1 to VinVoutAddress objects by mapTransactionInputsOutputsToAddresses

## Before

```ts
    targetAddresses: readonly VinVoutAddress[],
) =>
    F.toMutable(
        A.concat(
            A.intersection(addresses, targetAddresses),
            A.difference(addresses, targetAddresses),
        ),
    );

// describes if '+' or '-' sign should be shown as part of the transaction amount.
const transactionTypeToSignValueMap = {
```

## After

Replace the ts-belt set ops with a Set keyed on the same fields the structural compare uses, so semantics are unchanged and cost drops to O(n+m):

const key = (a: VinVoutAddress) => `${a.address}|${a.outputIndex}|${a.isChangeAddress}|${a.txTargetId}`;
export const sortTargetAddressesToBeginning = (addresses, targetAddresses) => {
const targetKeys = new Set(targetAddresses.map(key));
const [inTargets, rest] = arrayPartition(addresses, a => targetKeys.has(key(a)));
return [...inTargets, ...rest];
};

(The current code also de-duplicates via uniqBy inside difference but not inside the intersection branch, which is inconsistent; if de-duplication is actually wanted, do it once with a Set of keys.)

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(n^2) ts-belt caml_equal deep-equality compares (uniqBy inside A.difference) + O(n*m) for A.intersection, per inputs and again per outputs`** — warm path.

Both useSelector calls end in sortTargetAddressesToBeginning (suite-native/transactions/src/utils.ts:52-53), which calls ts-belt's A.intersection and A.difference. A.difference is implemented as `reject(uniqBy(xs, identity), v => includes(ys, v))` and ts-belt's `_uniqBy` is a nested while/someU loop -> O(n^2), where every comparison is `caml_equal`, a recursive ReScript structural compare that runs two for-in passes with hasOwnProperty over each 4-field object (node_modules/@mobily/ts-belt/dist/cjs/Array/index.js:1644 and :402). A.intersection adds another O(n*m) + uniqBy. n is whatever blockbook returned for the tx and is stored verbatim: a Bitcoin consolidation the user made, or an exchange batch payout they received, routinely carries several hundred to a few thousand vin/vout. Entry point: opening any transaction from the TransactionList (TransactionDetailScreen -> NetworkTransactionDetailSummary). Note the UI only ever displays `targetAddresses.slice(0, 2)` (TransactionDetailAddressesSection.tsx:70), so the whole quadratic pass is spent ordering rows that are then thrown away.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Downgraded P1 -> P2: it is a selector on a render path, but the screen is opened per-transaction by the user, not a per-frame/per-notification path, and the large-n case (hundreds-to-thousands of vin/vout) is real but not the common transaction. Behaviour deltas the fix must preserve: (1) A.intersection picks the LONGER of the two arrays as the filter base (`match = xs.length > ys.length ? [xs, ys] : [ys, xs]`, index.js:1976), so when targetAddresses is longer than addresses the current result is ordered by targetAddresses, not by addresses — a Set/partition fix always keeps `addresses` order; (2) both A.intersection and A.difference run uniqBy, so today duplicates are collapsed in BOTH halves — the proposed arrayPartition fix drops that dedup entirely, so either keep a seen-Set or state the delta explicitly. Objects are re-allocated per selector run, so a Set of object identities cannot work; key on `${address}|${outputIndex}|${isChangeAddress}|${txTargetId}` as proposed. Companion edit: A/F/pipe imports in utils.ts stay used elsewhere (mapTransactionInputsOutputsToAddresses), but A.concat/A.intersection/A.difference become unused — no import change needed since it is a namespace import. Confirmed the consumer only shows targetAddresses.slice(0, 2) (TransactionDetailAddressesSection.tsx:72), with a show-more sheet behind it.

- Spans more than one file — see also `suite-native/transactions/src/utils.ts:52`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
