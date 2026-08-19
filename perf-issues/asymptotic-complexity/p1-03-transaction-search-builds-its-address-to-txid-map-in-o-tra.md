# Transaction search builds its address→txid map in O(transactions²) — dedupe the buckets with a `Set`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Three anchors in one function chain: `groupTransactionIdsByAddress` scans each address bucket per insertion, the address loop scans the label-matched address array per address, and `search.toLowerCase()` is re-allocated inside every per-transaction loop. **This should extend [#31124](https://github.com/trezor/trezor-suite/issues/31124)** (line 240 of the same file, already filed) rather than open a competing issue — all four anchors sit inside `simpleSearchTransactions` and a single PR should carry them.

## Where

[`suite-common/transaction-search/src/simpleSearchTransactions.ts:29`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/simpleSearchTransactions.ts#L29)
[`suite-common/transaction-search/src/simpleSearchTransactions.ts:182`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/simpleSearchTransactions.ts#L182)
[`suite-common/transaction-search/src/simpleSearchTransactions.ts:192`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/simpleSearchTransactions.ts#L192) (also 195, 200–203, 216, 228)

`simpleSearchTransactions` rebuilds an address→txid index from the account's whole transaction history on every free-text search. The index is an array-of-txids per address that is deduped with `Array.prototype.includes` on each insertion, so the bucket for a frequently-reused address is rescanned once per transaction that touches it. The same pass then does a linear scan over the label-matched address list per address, and re-lowercases the search string inside each per-transaction loop.

## Before

### 1. `groupTransactionIdsByAddress` — the address→txid buckets

```ts
const groupTransactionIdsByAddress = (transactions: WalletAccountTransaction[]) => {
    const addresses: Record<string, string[]> = {};
    const addAddress = (txid: string, addrs: string[] | undefined) => {
        if (!addrs) {
            return;
        }

        addrs.forEach(address => {
            if (!addresses[address]) {
                addresses[address] = [];
            }

            if (!addresses[address].includes(txid)) {
                addresses[address].push(txid);
            }
        });
    };

    transactions.forEach(t => {
        // Inputs
        t.details.vin.forEach(vin => addAddress(t.txid, vin.addresses));
        // Outputs
        t.details.vout.forEach(vout => addAddress(t.txid, vout.addresses));
        // Targets
        t.targets.forEach(target => addAddress(t.txid, target.addresses));
    });

    return addresses;
};
```

### 2. The address-label and address branches

```ts
// Find by address label
const addressesForLabel = groupAddressesByLabel(accountLabels);
const foundAddressesForLabel = typedObjectKeys(addressesForLabel).flatMap(label => {
    if (label.toLowerCase().includes(search.toLowerCase())) {
        return addressesForLabel[label];
    }

    return [];
});

// Find by address
const txsForAddresses = groupTransactionIdsByAddress(transactions);
const foundTxsForAddress = typedObjectKeys(txsForAddresses).flatMap(address => {
    if (
        address.toLowerCase().includes(search.toLowerCase()) ||
        foundAddressesForLabel.includes(address)
    ) {
        return txsForAddresses[address] ?? [];
    }

    return [];
});
txsToSearch.push(...foundTxsForAddress);
```

### 3. `search.toLowerCase()` inside the per-transaction loops

```ts
    const txsToSearch: string[] = [];

    // ... unchanged

    // Find by token name, symbol or contract
    const foundTxsForToken = transactions.flatMap(transaction => {
        const isNativeSymbolSearch = isNativeDisplaySymbolSearch(
            transaction.symbol,
            search.toLowerCase(),
        );
        const hasMatchingToken = transaction.tokens.some(
            token =>
                (isNativeSymbolSearch
                    ? token.symbol?.toLowerCase() === search.toLowerCase()
                    : isTokenTransferMatchesSearch(token, search.toLowerCase())) ||
                token.to?.toLowerCase().includes(search.toLowerCase()) ||
                token.from?.toLowerCase().includes(search.toLowerCase()),
        );

    // ... unchanged

    // Find by native coin symbol
    const foundTxsForNativeSymbol = transactions.flatMap(transaction => {
        if (isNativeTransferMatchesSearch(transaction, search.toLowerCase())) {

    // ... unchanged

    // Find by evm parsed function selector
    const foundTxsForFunctionSelector = transactions.flatMap(transaction => {
        const hasMatchingFunctionSelector =
            transaction.ethereumSpecific &&
            isFunctionSelectorMatchesSearch(transaction.ethereumSpecific, search.toLowerCase());
```

## After

### 1. `groupTransactionIdsByAddress` — the address→txid buckets

```ts
const groupTransactionIdsByAddress = (transactions: WalletAccountTransaction[]) => {
    const addresses: Record<string, Set<string>> = {};
    const addAddress = (txid: string, addrs: string[] | undefined) => {
        if (!addrs) {
            return;
        }

        addrs.forEach(address => {
            if (!addresses[address]) {
                addresses[address] = new Set();
            }

            addresses[address].add(txid);
        });
    };

    transactions.forEach(t => {
        // Inputs
        t.details.vin.forEach(vin => addAddress(t.txid, vin.addresses));
        // Outputs
        t.details.vout.forEach(vout => addAddress(t.txid, vout.addresses));
        // Targets
        t.targets.forEach(target => addAddress(t.txid, target.addresses));
    });

    return addresses;
};
```

### 2. The address-label and address branches

```ts
// Find by address label
const addressesForLabel = groupAddressesByLabel(accountLabels);
const foundAddressesForLabel = new Set(
    typedObjectKeys(addressesForLabel).flatMap(label => {
        if (label.toLowerCase().includes(lowerCaseSearch)) {
            return addressesForLabel[label] ?? [];
        }

        return [];
    }),
);

// Find by address
const txsForAddresses = groupTransactionIdsByAddress(transactions);
const foundTxsForAddress = typedObjectKeys(txsForAddresses).flatMap(address => {
    if (address.toLowerCase().includes(lowerCaseSearch) || foundAddressesForLabel.has(address)) {
        return [...(txsForAddresses[address] ?? [])];
    }

    return [];
});
txsToSearch.push(...foundTxsForAddress);
```

### 3. `search.toLowerCase()` inside the per-transaction loops

```ts
    const lowerCaseSearch = search.toLowerCase();
    const txsToSearch: string[] = [];

    // ... unchanged

    // Find by token name, symbol or contract
    const foundTxsForToken = transactions.flatMap(transaction => {
        const isNativeSymbolSearch = isNativeDisplaySymbolSearch(
            transaction.symbol,
            lowerCaseSearch,
        );
        const hasMatchingToken = transaction.tokens.some(
            token =>
                (isNativeSymbolSearch
                    ? token.symbol?.toLowerCase() === lowerCaseSearch
                    : isTokenTransferMatchesSearch(token, lowerCaseSearch)) ||
                token.to?.toLowerCase().includes(lowerCaseSearch) ||
                token.from?.toLowerCase().includes(lowerCaseSearch),
        );

    // ... unchanged

    // Find by native coin symbol
    const foundTxsForNativeSymbol = transactions.flatMap(transaction => {
        if (isNativeTransferMatchesSearch(transaction, lowerCaseSearch)) {

    // ... unchanged

    // Find by evm parsed function selector
    const foundTxsForFunctionSelector = transactions.flatMap(transaction => {
        const hasMatchingFunctionSelector =
            transaction.ethereumSpecific &&
            isFunctionSelectorMatchesSearch(transaction.ethereumSpecific, lowerCaseSearch);
```

## Why it matters

Hunk 1 is genuinely quadratic. `n` is the account's fetched transaction history — thousands on a real BTC account, and every transaction on an EVM/XRP/Stellar account carries the account's own descriptor in a vin, a vout and a target. That one bucket therefore grows to the full transaction count, and roughly three insertions per transaction each rescan it linearly: about `3n²/2` string comparisons, on top of `n` bucket-array reallocations. Reused BTC receive and change addresses produce the same shape at a smaller constant.

The whole thing is rebuilt from scratch per call, and the call is not rare. The UI path is `TransactionList.tsx:68` — a 200 ms-debounced `advancedSearchTransactions` over the entire fetched history — and that wrapper invokes `simpleSearchTransactions` once per `&`/`|` term (`advancedSearchTransactions.ts:28`/`:36`), so a two-term search doubles the work. The second caller is `exportTransactionsActions.ts:93`, which runs it once over the full history when a CSV/PDF export carries a search query. Nothing memoizes the result: `packages/suite` does not use React Compiler, and the debounce callback recomputes on every tick.

Hunk 2 is `O(addresses × labelMatchedAddresses)` — the outer collection is every distinct address across the history, the inner one every address the user has labelled with a matching label. Hunk 3 is not asymptotic but allocates a fresh lowercased string on every evaluation: once per transaction at 195, 216 and 228, and up to four times per _token transfer_ at 200–203, so an EVM account with multi-transfer transactions pays several allocations per transaction per keystroke.

For scale, [#31122](https://github.com/trezor/trezor-suite/issues/31122) measured 227 ms for a comparable quadratic pass at n=2000 — that is that issue's measurement of a different function, not a benchmark of this one, but it is the right order of magnitude for what a quadratic pass over a couple of thousand items costs on the main thread. Here that cost lands on every debounced keystroke while the user types into the transaction search box.

## Notes

- **Fold this into [#31124](https://github.com/trezor/trezor-suite/issues/31124), do not open a competing issue.** All four anchors in this file (29, 182, 192, 240) are inside the same function chain and a split would mean two PRs fighting over the same 40 lines.
- **Companion edit for hunk 1:** line 184 must become `[...(txsForAddresses[address] ?? [])]`. `flatMap` requires the callback to return a value or an array; a `Set` is neither, so returning the bucket unwrapped no longer type-checks.
- **Companion edit for hunk 2:** line 171 gains `?? []`. Without it the `flatMap` callback returns `string[] | undefined` (`noUncheckedIndexedAccess` is on repo-wide, `tsconfig.base.json:17`), which makes the new `Set` a `Set<string | undefined>` — it would still work, but the `?? []` matches what lines 160 and 184 already do and keeps the type clean.
- **Ordering is preserved.** `Set` iterates in insertion order and the old `includes` guard already suppressed duplicates, so the txid sequence pushed into `txsToSearch` for a given address is byte-for-byte what it was. The final `transactions.filter(...)` at 239 preserves the account's own transaction order regardless.
- **`lowerCaseSearch` must be hoisted below the last reassignment of `search`.** `search` is a reassigned parameter (85 `trim()`, 95 date prefix, 102 operator strip); the natural spot is next to `const txsToSearch` at 141, which is after the `searchOperator` block — every path through that block returns, so `search` is stable from 141 onwards. Hoisting it to the top of the function would change behaviour.
- Line 147 (`targetAmount.includes(search)`) intentionally uses the raw, non-lowercased `search` — leave it alone.
- `groupTransactionsByLabel` (47) has the same bucket-of-strings shape but no `includes` guard, so it is linear already and needs no change.
- **The path is gated.** `simpleSearchTransactions` returns early for empty/operator-only searches (88), for `< > = !=` date searches (105–129) and for `< > = !=` amount searches (132–138), so only free-text search reaches any of these three hunks.
- **Test coverage is thin.** `simpleSearchTransactions.test.ts` has seven cases, all of which pass `emptyLabels` and a single transaction, and all of which exercise the native-symbol / token-symbol branches. Nothing covers the address map, the address-label branch or the `&`/`|` wrapper. Worth adding: two transactions sharing an address (hunk 1 dedupe), and one address-label match (hunk 2).
- **Follow-up, once #31124's `const foundTxIds = new Set(txsToSearch)` lands:** `txsToSearch` itself could become a `Set<string>` built with `.add`, which would let the address branch feed the bucket in without the `[...]` materialization at 184 and drop the four `push(...spread)` calls. Out of scope for the minimal fix, but it is where this file wants to end up.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
