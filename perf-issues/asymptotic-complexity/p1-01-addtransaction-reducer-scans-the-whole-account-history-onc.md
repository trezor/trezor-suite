# `addTransaction` reducer scans the whole account history once per incoming transaction — index the txids into a `Map` before the loop

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. The `unshift`-per-transaction branch in the same reducer is the same "work grows faster than the collection" principle on a non-array-method surface: every insert re-indexes the whole array.

## Where

[`suite-common/wallet-core/src/transactions/transactionsReducer.ts:71`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L71) (+`:80`, `:84`), and [`:50`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L50)/[`:57`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L57) in the same reducer.

`addTransaction` decides "new or update?" by running `findTransaction` — a plain `.find` — over the account's entire stored transaction array, once per incoming transaction, then re-scans with `findIndex` to recover the index the first scan already had. The collection being scanned is loop-invariant, so it can be indexed once above the loop. `removeTransaction` has the mirror shape: a `.some()` over the removal list evaluated for every stored transaction.

## Before

### 1. `addTransaction` — full-history scan per incoming transaction

```ts
.addCase(transactionsActions.addTransaction, (state, { payload }) => {
    const { transactions, account, page, perPage } = payload;
    if (transactions.length < 1) return;
    initializeAccount(state, account.key);
    const accountTxs = state.transactions[account.key];

    if (!accountTxs) return;
    transactions.forEach((transaction, i) => {
        // first we need to make sure that transaction is not undefined, then check if transactionid matches
        const existingTx = findTransaction(transaction.txid, accountTxs);
        if (!existingTx) {
            // add a new transaction
            if (page && perPage) {
                // insert a tx object at correct index
                const txIndex = (page - 1) * perPage + i; // Needs to be same as TX_PER_PAGE
                accountTxs[txIndex] = transaction;
            } else {
                // no page arg, insert the tx at the beginning of the array
                accountTxs.unshift(transaction);
            }
        } else {
            // update the transaction if conditions are met
            const existingTxIndex = accountTxs.findIndex(
                t => t?.txid === existingTx.txid,
            );
            const existingBlockHeight = existingTx.blockHeight ?? 0;
            const incomingBlockHeight = transaction.blockHeight ?? 0;
            const existingIsPending = existingBlockHeight <= 0;
            const incomingIsPending = incomingBlockHeight <= 0;

            if (
                (existingIsPending && !incomingIsPending) ||
                (existingIsPending === incomingIsPending &&
                    existingBlockHeight < incomingBlockHeight) ||
                (existingIsPending === incomingIsPending &&
                    (existingTx.blockTime ?? 0) < (transaction.blockTime ?? 0)) ||
                (existingIsPending && !existingTx.rbfParams && transaction.rbfParams) ||
                (existingTx.deadline && !transaction.deadline)
            ) {
                // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
                accountTxs[existingTxIndex] = { ...transaction };
            }
        }
    });
})
```

### 2. `removeTransaction` — `.some()` over the removal list per stored transaction

```ts
.addCase(transactionsActions.removeTransaction, (state, { payload }) => {
    const { account, txs } = payload;

    const transactions = state.transactions[account.key];
    if (transactions) {
        state.transactions[account.key] = transactions.filter(
            tx => !txs.some(t => t.txid === tx?.txid),
        );
    }

    const phishing = state.phishing[account.key];
    if (phishing) {
        state.phishing[account.key] = phishing.filter(
            tx => !txs.some(t => t.txid === tx),
        );
    }
})
```

## After

### 1. `addTransaction` — one index pass, one prepend

A module-scope helper next to `initializeAccount`, replacing the per-transaction `unshift`:

```ts
// Transactions the account does not have yet, in reverse order: the reducer used to insert them
// one at a time with `unshift`, which reverses the batch and re-indexes the array per insert.
const getTransactionsToPrepend = (
    transactions: WalletAccountTransaction[],
    accountTxs: (WalletAccountTransaction | undefined)[],
) => {
    const knownTxids = new Set<string>();
    accountTxs.forEach(tx => {
        if (tx?.txid) knownTxids.add(tx.txid);
    });

    const newTxs = transactions.filter(transaction => {
        // one batch can carry the same txid twice - several utxos can belong to one transaction
        if (knownTxids.has(transaction.txid)) return false;
        knownTxids.add(transaction.txid);

        return true;
    });
    newTxs.reverse();

    return newTxs;
};
```

```ts
.addCase(transactionsActions.addTransaction, (state, { payload }) => {
    const { transactions, account, page, perPage } = payload;
    if (transactions.length < 1) return;
    initializeAccount(state, account.key);
    const storedTxs = state.transactions[account.key];

    if (!storedTxs) return;

    // no page arg: every unknown tx goes to the beginning of the array, all of them at once
    const prependedTxs: WalletAccountTransaction[] =
        page && perPage ? [] : getTransactionsToPrepend(transactions, storedTxs);
    const accountTxs: WalletAccountTransaction[] =
        prependedTxs.length > 0 ? prependedTxs.concat(storedTxs) : storedTxs;
    if (prependedTxs.length > 0) {
        state.transactions[account.key] = accountTxs;
    }

    // index the stored transactions once instead of scanning them per incoming transaction.
    // first-wins, so a txid stored twice resolves to the slot `find`/`findIndex` returned
    const indexByTxid = new Map<string, number>();
    accountTxs.forEach((tx, index) => {
        if (tx?.txid && !indexByTxid.has(tx.txid)) indexByTxid.set(tx.txid, index);
    });

    transactions.forEach((transaction, i) => {
        const existingTxIndex = indexByTxid.get(transaction.txid);
        const existingTx =
            existingTxIndex === undefined ? undefined : accountTxs[existingTxIndex];

        // the txid check catches a slot overwritten by a paged insert earlier in this batch
        if (
            existingTxIndex === undefined ||
            !existingTx ||
            existingTx.txid !== transaction.txid
        ) {
            // add a new transaction
            if (page && perPage) {
                // insert a tx object at correct index
                const txIndex = (page - 1) * perPage + i; // Needs to be same as TX_PER_PAGE
                accountTxs[txIndex] = transaction;
                indexByTxid.set(transaction.txid, txIndex);
            }
            // without page/perPage the transaction has already been prepended above

            return;
        }

        // update the transaction if conditions are met
        const existingBlockHeight = existingTx.blockHeight ?? 0;
        // ... unchanged comparison of blockHeight / blockTime / rbfParams / deadline
        if (/* ... unchanged */) {
            // pending tx got confirmed (blockHeight changed from undefined/0 to a number > 0)
            accountTxs[existingTxIndex] = { ...transaction };
        }
    });
})
```

### 2. `removeTransaction` — one `Set`, two filters

```ts
.addCase(transactionsActions.removeTransaction, (state, { payload }) => {
    const { account, txs } = payload;
    const removedTxids = new Set(txs.map(tx => tx.txid));

    const transactions = state.transactions[account.key];
    if (transactions) {
        state.transactions[account.key] = transactions.filter(
            tx => !tx?.txid || !removedTxids.has(tx.txid),
        );
    }

    const phishing = state.phishing[account.key];
    if (phishing) {
        state.phishing[account.key] = phishing.filter(txid => !removedTxids.has(txid));
    }
})
```

## Why it matters

`addTransaction` is O(incoming × stored) per dispatch. `n` at runtime is the account's **entire stored transaction history**, and the driver is `fetchAllTransactionsForAccountThunk` ([`transactionsThunks.ts:743`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L743)), a `while (true)` paging loop that dispatches `addTransaction` once per page — 25 transactions per page for most networks, **8 for Cardano and Solana** ([`PAGING`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/constants/paging.ts)). Cumulatively that is O(N²/perPage) over a full history fetch: a 10 000-transaction account is 400 pages × up to 10 000 elements ≈ **5·10⁷ element visits**, every one of them a proxy get on an immer draft, all inside the reducer and therefore blocking the dispatch. The same loop is entered on every visit to the transaction list, the CSV/export action, and both staking dashboards. `Array.prototype.find` does not skip holes, so the sparse paged array is scanned over its full allocated length even while most of it is still empty.

The `unshift` branch is separately O(m²): `fetchUtxoTransactionsForAccountThunk` ([`transactionsThunks.ts:678`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L678)) passes no `page`/`perPage`, so every insert both scans the array and shifts it. It requests one transaction per UTXO (`account.utxo.map(utxo => utxo.txid)`) and is dispatched from the coin-control panel mounting in the send form ([`CoinControl.tsx:147`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L147)) — thousands of UTXOs on a coinjoin account. For scale on that same screen: #31126 measured **167 ms → 1.7 ms at 5000 UTXOs / 20000 txs** for a different quadratic in the coin-control path; that is that issue's measurement, not one taken here.

`removeTransaction` is O(history × removed). Removal lists are normally tiny, but the coinjoin reorg handler ([`coinjoinAccountActions.ts:328`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L328)) removes every transaction at or above a checkpoint height, so both factors can be large at once.

## Notes

- **The index map must be first-wins.** Today `find` returns the first match and `findIndex` returns that same index. A naive `new Map(accountTxs.map((tx, i) => [tx.txid, i]))` keeps the _last_ index, and since a txid can appear twice in the sparse paged array, the update would be written to the wrong slot. Hence the `!indexByTxid.has(...)` guard.
- **The map must be maintained inside the loop**, because the paged branch writes into the array as it goes: a later duplicate in the same batch must still resolve to the slot the earlier one was written to.
- **A paged write can invalidate an entry**, when the slot it overwrites held a different transaction (page contents shift as new transactions arrive at the top). The `existingTx.txid !== transaction.txid` guard makes the lookup self-correcting and falls through to the insert branch, which is what happens today.
- **Batching the prepend is a prerequisite, not an extra.** `unshift` shifts every index, so keeping it per-transaction would invalidate the map on each insert. Ordering must be preserved: `n` sequential `unshift`s reverse the batch, so the collected array is reversed before it is prepended. `accountsThunks.ts:266` already calls `.reverse()` on its payload to compensate for that behaviour — the net order is unchanged and that call must be left alone.
- **Within-batch dedup is load-bearing**, not an optimization. `fetchUtxoTransactionsForAccountThunk` requests one transaction per UTXO, and several UTXOs commonly share one transaction, so the payload repeats txids. Today the per-transaction `find` swallows the duplicates; the prepend helper has to do the same or the array gains duplicate rows.
- `newTxs.reverse()` mutates a freshly created local array, so it is safe and side-steps the `toReversed` Hermes question that applies to `suite-common` code reaching `suite-native`.
- Deliberately **not** `accountTxs.unshift(...newTxs)`: a coinjoin UTXO batch can spread tens of thousands of arguments and hit the engine's argument limit. Prepending via `concat` and reassigning the slice is also the pattern `removeTransaction` already uses in this file, so immer finalization of an array holding drafts is proven here.
- Companion edit: the `findTransaction` import at [`transactionsReducer.ts:5`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L5) becomes unused and must be dropped. The helper itself stays — `transactionUtils.ts:620` and `TransactionRenderer.tsx:53` still use it.
- Typing: this file compiles under `noUncheckedIndexedAccess` (see the `@ts-expect-error` at `:138`), hence the `existingTxIndex === undefined` disjunct — it is there so TypeScript narrows both the index and the transaction after the early return. The explicit `WalletAccountTransaction[]` annotations on `prependedTxs` and `accountTxs` are load-bearing: without them the ternaries infer `never[] | WalletAccountTransaction[]` and a union of "draft array" and "plain array", neither of which accepts `.concat()` or an indexed write; the draft-to-plain assignability it relies on is the same one the current `findTransaction(transaction.txid, accountTxs)` call already depends on. `WalletAccountTransaction` needs to be added to the existing `@suite-common/wallet-types` type import.
- Behaviour delta in `removeTransaction`: `!tx?.txid ||` keeps holes and `undefined` entries in the array exactly as the current `.some()` does (a hole matches nothing, so it survives the filter).
- Coverage: [`transactionsReducer.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.test.ts) drives 9 `addTransaction` fixtures and 2 `removeTransaction` fixtures, `transactionReducer.test.ts` asserts that re-adding the stored transactions is a no-op, and `packages/suite/src/actions/wallet/transactionActions.test.ts:33` covers a single `page: 1` insert. **No fixture passes `page`/`perPage` with more than one transaction, none covers duplicate txids in one batch, and none asserts prepend ordering** — the three behaviours this change is most likely to break. Add fixtures for them first.
- Sibling: the storage middleware deletes and re-writes the account's entire persisted transaction history on every `addTransaction` ([`storageMiddleware.ts:178`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L178)), driven by this same paging loop. Fixing only one of the two leaves the other dominant on a large account; they are best scheduled together.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
