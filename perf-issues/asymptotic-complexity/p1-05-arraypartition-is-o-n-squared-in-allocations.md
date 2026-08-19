# `arrayPartition` is O(n²) in allocations — replace the spread accumulator with two pushes

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Don't spread the accumulator in `.reduce()`"_. This is the array-shaped sibling of the object spread the skill names: `arrayPartition` is a `@trezor/utils` primitive with ~33 call sites, so the cost multiplies across the whole monorepo, and two of those call sites run over a full account transaction list.

## Where

[`packages/utils/src/arrayPartition.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/arrayPartition.ts#L12)

The helper splits an array in two by a predicate. It does so by rebuilding one of the two output arrays from scratch on every element — `[...pass, elem]` copies everything accumulated so far — and allocating a fresh 2-tuple per element on top of that. A single forward pass with two `push`es produces exactly the same two arrays.

## Before

```ts
type ArrayPartition = {
    <T, S extends T>(array: T[], condition: (elem: T) => elem is S): [S[], Exclude<T, S>[]];
    <T>(array: T[], condition: (elem: T) => boolean): [T[], T[]];
};

/**
 *
 * @param array Array to be divided into two parts.
 * @param condition Condition for inclusion in the first part.
 * @returns Array of two arrays - the items in the first array satisfy the condition and the rest is in the second array. Preserving original order.
 */
export const arrayPartition: ArrayPartition = <T>(array: T[], condition: (elem: T) => boolean) =>
    array.reduce<[T[], T[]]>(
        ([pass, fail], elem) =>
            condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
        [[], []],
    ) as any;
```

## After

```ts
type ArrayPartition = {
    <T, S extends T>(array: T[], condition: (elem: T) => elem is S): [S[], Exclude<T, S>[]];
    <T>(array: T[], condition: (elem: T) => boolean): [T[], T[]];
};

/**
 *
 * @param array Array to be divided into two parts.
 * @param condition Condition for inclusion in the first part.
 * @returns Array of two arrays - the items in the first array satisfy the condition and the rest is in the second array. Preserving original order.
 */
export const arrayPartition: ArrayPartition = <T>(array: T[], condition: (elem: T) => boolean) => {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach(elem => {
        if (condition(elem)) {
            pass.push(elem);
        } else {
            fail.push(elem);
        }
    });

    return [pass, fail] as any;
};
```

## Why it matters

O(n²) element copies (~n²/2) and 2n array allocations become O(n) copies and 2 allocations. The predicate is still called exactly once per element, so the only work removed is copying.

`n` at runtime is whatever the caller passes, and two callers pass transaction lists:

- [`suite-common/wallet-utils/src/transactionUtils.ts:721`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L721) — `analyzeTransactions` partitions `known`, the account's entire stored transaction history, into prepending vs. rest. It is called from `fetchAndUpdateAccountThunk` ([`accountsThunks.ts:243`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsThunks.ts#L243)) on every account refresh — i.e. on every new block and every account update, per account. A long-lived BTC or EVM account holds thousands of transactions.
- [`suite-native/transactions/src/components/TransactionList.tsx:214`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L214) — partitions the account's loaded transactions into pending vs. confirmed inside the list's `useMemo`. The list is infinite-scroll (`handleOnLoadMore` appends pages), so `n` grows monotonically as the user scrolls, on the mobile app's main account screen and on Hermes.

The remaining ~31 call sites are bounded — networks, fee levels, round inputs, USB devices, menu entries — and simply get the win for free. One deserves a mention because it amplifies: [`packages/utils/src/topologicalSort.ts:16`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/topologicalSort.ts#L16) calls `arrayPartition` inside a `while` loop, so today's quadratic partition becomes cubic in the number of vertices in the worst (chain) case. Its `n` is one same-block-height group of transactions, so it is not the reason to fix this, but it is the reason the fix compounds.

No number here is measured. For scale, #31122 reports 227 ms at n=2000 for the same defect class in `arrayToDictionary` — that is that issue's measurement, on an object accumulator, not this one.

## Notes

- Behaviour is identical: same two arrays, same relative order preserved in each half, predicate invoked once per element in index order. The existing tests in [`packages/utils/src/arrayPartition.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/arrayPartition.test.ts) (objects, numbers, strings, type predicate) all pass unchanged; extend that file with an empty-array case and an all-pass/all-fail case rather than adding a new one.
- Both implementations return freshly allocated arrays, including in the all-pass / all-fail / empty cases. That matters because callers mutate the halves in place — `pendingTxs.sort(sortPendingTransactions)` at `TransactionList.tsx:219` and `roots.sort(tie)` at `topologicalSort.ts:22`. The fix preserves that; it must not be "optimized" further into returning slices of, or references to, the input array.
- The `as any` on the return stays required: the implementation signature cannot satisfy the overloaded `ArrayPartition` type (the type-predicate overload narrows to `[S[], Exclude<T, S>[]]`). Keeping the cast is why the call-site types are unaffected — no consumer needs a change.
- The arrow body becomes a block, so the explicit `[T[], T[]]` reduce type argument disappears; the two local `const pass: T[]` / `const fail: T[]` annotations replace it and are required (TypeScript would otherwise infer `never[]`).
- `if`/`else` rather than `(condition(elem) ? pass : fail).push(elem)`, per `skills/basic-syntax`. Either compiles; the block form is what the repo reads like.
- `packages/utils` is a published package — this is a pure internal change, no API or `.d.ts` surface moves.
- Land this before the `blockbook.ts` hunk in the sibling `transformAddresses` issue: with a linear `arrayPartition`, [`packages/blockchain-link-utils/src/blockbook.ts:431-432`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L431) (`const external = addresses.filter(a => !internal.includes(a))`, O(addresses²)) collapses to a single `arrayPartition(addresses, a => a.path.split('/')[4] === '1')`. That is the idiomatic fix there and it only pays off once this one lands.
- `arrayDistinct` in the same package is the other quadratic `@trezor/utils` primitive; it is tracked separately because, unlike this one, it cannot be fixed in place (a `filter` predicate has nowhere to hold a seen-set) and needs per-call-site edits.
- React Compiler: `suite-native` has `experiments.reactCompiler: true`, so the `TransactionList` `useMemo` is already stable on `transactions` identity — the compiler does not make the partition cheaper, it only bounds how often it runs. `packages/suite` does not have the compiler on, but no `packages/suite` call site of this helper is transaction-sized.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
