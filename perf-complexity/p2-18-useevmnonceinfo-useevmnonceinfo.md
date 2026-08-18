# `useEvmNonceInfo` re-derives the account's nonce sets once per transaction row — memoize per account, not per row

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:90`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useEvmNonceInfo.ts#L90) (also 43,86,91) — `useEvmNonceInfo`

`transactions` is the account's entire loaded transaction list (`selectAccountTransactions(state, account.key)`), read at line 43. The hook is instantiated once per rendered transaction row.

## Before

```ts
    return useMemo(() => {
        if (!isEnabled || data === undefined) return { nonceInfo: undefined, isLoading: false };

        const nonceInfo = data.isTrusted
            ? getEvmNonceInfoFromConfirmedNonce(parseInt(data.nonce, 10), transactions)
            : getEvmNonceInfo(parseInt(data.nonce, 10), transactions);

        return { nonceInfo, isLoading };
    }, [isEnabled, data, transactions, isLoading]);
};
```

## After

Derive the nonce sets once per account instead of once per row: wrap `getOwnEvmNonceSets` in a `createMemoizedSelector` keyed on `accountKey` (next to `selectAccountTransactions` in suite-common/wallet-core/src/transactions/transactionsSelectors.ts) and have the hook read the memoized sets, or compute `nonceInfo` once in `TransactionList` and pass it down as a prop. Either collapses 25 full scans into 1.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(rows x N x ~8 passes) per transaction-list re-derivation; rows = 25 (getTxsPerPage), N = account transactions`** — hot path.

This is the two-file case the skill warns about: `TransactionItem.tsx:103` calls `useEvmNonceInfo(nonceAccount)` unconditionally for every row, and `TransactionList.tsx:130` renders `perPage` = 25 rows (`getTxsPerPage`). Each row's `useMemo` runs `getOwnEvmNonceSets(transactions)` (suite-common/wallet-utils/src/transactionUtils.ts:130), which is 4 `.filter` + 2 `.map` passes plus two `Set` builds plus two spread-to-array allocations over the WHOLE account tx array -- and every row computes the identical value. On an EVM account after a full history load (10k+ txs) that is 25 x 10,000 x ~8 passes per list render, and it re-runs for all 25 rows on every `transactions` identity change, i.e. once per page fetched during `fetchAllTransactionsForAccountThunk` and once per new-tx notification. Only `pendingEvmNonce !== undefined` rows actually consume the result (TransactionItem.tsx:112).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- `selectAccountTransactions` IS a `createMemoizedSelector`, so the array identity is stable across unrelated renders — the 25 scans do NOT run on every render, only when the account's tx list actually changes. That is still once per page during `fetchAllTransactionsForAccountThunk` (i.e. up to ~N/25 times) and once per new-tx notification, so the total work over a full history load is O(N^2 x 8). Only reached for `networkType === 'ethereum'` accounts (TransactionItem.tsx:100-102 narrows, otherwise `nonceAccount` is undefined -> `isEnabled` false -> early return). Also only reached once the react-query `data` resolves; the query itself is deduped by react-query across rows, so the network side is fine — only the derivation is duplicated. Fix caveat: if hoisting into a memoized selector, note the existing consumers `TxDetailModal.tsx:103`, `AccountNonce.tsx:12`, `EthereumOptions.tsx:37` also call the hook and must keep working; and the derivation depends on the fetched `data.nonce` (react-query state), not just redux, so a pure redux selector can only memoize `getOwnEvmNonceSets`, with the nonce-walking arithmetic staying in the hook. That is the right split anyway — the sets are the O(N) part.

- Spans more than one file — see also `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
