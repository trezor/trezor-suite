---
name: performance-complexity
description: Collection-handling performance for Trezor Suite — indexing before iteration, O(1) sort comparators, and reduce accumulators that don't allocate. Use when writing a loop, sort or reduce over accounts, tokens, transactions or UTXOs.
---

# Asymptotic Complexity

Work that grows faster than the collection it runs on. Ask what `n` is at runtime first: network lists,
fee levels and account types are bounded at a few dozen forever, so a nested scan over them is fine and
always will be. Transactions, UTXOs, tokens, contracts and rates grow with the account or with upstream
data, and the large end is real — `buildCoinDataForPlatform` returns a `Set` so callers avoid "a linear
scan over tens of thousands of contracts"
([fetchCoins.ts](../../suite-common/token-definitions/scripts/utils/fetchCoins.ts)). Anything a linter
could decide belongs in [`noRestrictedSyntax`](../../packages/eslint/src/javascriptConfig.mjs) or
[`eslint-local-rules/rules.ts`](../../eslint-local-rules/rules.ts) instead.

## Index by key before iterating, don't scan inside a loop

A `.find()`, `.some()` or `.includes()` inside a `.map()` or `.filter()` is O(n·m), and anything not
derived from the callback parameter belongs above the loop. Key the `Set` or `Map` on whatever the inner
comparison actually compares, reusing the key helper that already exists (`getUtxoOutpoint`,
`getAccountKey`) rather than inventing one.

```ts
// bad - simpleSearchTransactions.ts:239 rebuilds a deduped array per transaction, O(n²)
const found = transactions.filter(transaction => unique(txsToSearch).includes(transaction.txid));

// good - advancedSearchTransactions.ts:23 - index once, O(1) per transaction
const searchedTxIds = new Set(txsToSearch);

const found = transactions.filter(transaction => searchedTxIds.has(transaction.txid));
```

The costly instances span two files, so no grep finds them: `UtxoSelectionList.tsx:66` runs
`accountTransactions.find()` per row while `UtxoSelection.tsx:112` runs `selectedUtxos.some(isSameUtxo)`
per row ([#25937](https://github.com/trezor/trezor-suite/pull/25937#discussion_r2939995684),
[#26344](https://github.com/trezor/trezor-suite/pull/26344#discussion_r3027690127)).

## Keep a sort comparator to O(1) field reads

A scan inside a comparator is strictly worse than the same scan in a `.map()` — you pay an extra `log n`
factor — and allocating in one is nearly as bad: `utxoSortingUtils.ts:33` builds two `new BigNumber` per
comparison, and `sortUtxos` runs bare in a hook body at `useUtxoSelection.ts:94`.

```ts
// bad - utxoSortingUtils.ts:43 - getBlockTime scans txs, twice per comparison
const sorted = [...utxos].sort((a, b) => getBlockTime(b, txs) - getBlockTime(a, txs));

// good - index once, then the comparator is two Map reads
const blockTimeByTxid = new Map(txs.map(tx => [tx.txid, tx.blockTime ?? 0]));
const blockTimeOf = (utxo: AccountUtxo) => blockTimeByTxid.get(utxo.txid) ?? 0;

const sorted = utxos.toSorted((a, b) => blockTimeOf(b) - blockTimeOf(a));
```

## Don't spread the accumulator in `.reduce()` — use a `Map` or a keyed assign

Each `{ ...acc }` copies everything accumulated so far, making the `reduce` O(n²) in allocations.

```ts
// bad - fiatRatesReducer.ts:130 - one key per point of price history, merged in on every rate update
const byTimestamp = rates.reduce(
    (acc, rate) => ({ ...acc, [rate.lastTickerTimestamp]: rate.rate }),
    {},
);

// good - one insertion per rate
const byTimestamp = new Map(rates.map(rate => [rate.lastTickerTimestamp, rate.rate]));

// also good - a plain object, mutating the accumulator the reduce already owns
const byTimestamp = rates.reduce<Record<string, number>>((acc, rate) => {
    acc[rate.lastTickerTimestamp] = rate.rate;

    return acc;
}, {});
```

## Related skills

- [Defensive programming](../defensive-programming/SKILL.md) — why the sort above is `toSorted` and not
  `[...utxos].sort()`: the non-mutating array methods.
- [React hooks](../performance-react-hooks/SKILL.md) — memoization, dependency arrays, render loops.
- [DOM and CSS](../performance-dom/SKILL.md) — forced layout, observers, compositor-only animation.
- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — yielding long tasks, deferring
  background work.
