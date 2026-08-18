# `getOwnEvmNonceSets` walks the account's whole transaction history once per rendered EVM row — memoize per account

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite-common/wallet-utils/src/transactionUtils.ts:130`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L130) (also 131,137,144,169,222,257) — `getOwnEvmNonceSets`

n = the account's entire stored transaction history (WalletAccountTransaction[] for one EVM account); the multiplier is the number of TransactionItem rows mounted on the current page (perPage = 25, plus every pending tx)

## Before

```ts
    // than inferred from a scalar confirmedNonce that can transiently run ahead of the tx list.
    confirmedNonces: number[];
};

export const getOwnEvmNonceSets = (transactions: WalletAccountTransaction[]) => {
    const ownNonceTxs = transactions.filter(isSignedByAccount);

    // A nonce that's confirmed locally is ground truth. If a stale "pending" record for the same
    // nonce also lingers (e.g. a speed-up/cancel replacement got confirmed but the original's
    // local record was never swept — see replaceTransactionThunk), drop the pending duplicate so
    // it can't inflate nextNonce past where it actually is.
```

## After

Compute the nonce sets once per account and share them across rows. Either (a) add a memoized selector — createMemoizedSelector([selectAccountTransactions], getOwnEvmNonceSets) — and have useEvmNonceInfo read that instead of recomputing in a per-instance useMemo, or (b) hoist useEvmNonceInfo up to TransactionList/TransactionGroupedList and pass nonceInfo down to TransactionItem as a prop (it already receives network/disableBumpFee the same way). Separately, hoist the invariant out of the inner scan: `const lower = descriptor.toLowerCase();` above `details.vin.some(...)` in isSignedByDescriptor (transactionUtils.ts:76).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(rendered EVM rows x account tx history), ~4 full passes per row, plus 2 toLowerCase() allocations per visited vin address`** — hot path.

getOwnEvmNonceSets is a whole-history scan (filter isSignedByAccount, then two more filter/map chains over the result). It is correct as a once-per-account computation, but every TransactionItem row calls useEvmNonceInfo(nonceAccount) independently (packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103), and that hook's useMemo (packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:86-94) is per component instance, so getEvmNonceInfo/getEvmNonceInfoFromConfirmedNonce runs once PER ROW over the same full array. The list is the account transaction list (TransactionList -> TransactionGroupedList -> TransactionItem), the main screen of an EVM account. On top of that, isSignedByDescriptor (transactionUtils.ts:76-81) recomputes descriptor.toLowerCase() inside the per-address .some(), so each visited tx allocates 2 strings. With 3-5k stored txs and 25 rows that is ~100k+ tx visits and ~250k string allocations per pass, re-run whenever the account's tx array identity changes (every fetchAndUpdateAccountThunk).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Scope caveats to keep the issue honest: (1) the scan is EVM-only — TransactionItem.tsx:101-102 passes `undefined` for non-ethereum accounts, so `isEnabled` is false and useEvmNonceInfo.ts:86-87 returns before computing anything; bitcoin/cardano accounts pay nothing. (2) The useQuery backend fetch IS already deduped across rows (same queryKey), only the derivation is not — so the fix is purely about the useMemo, not the network call. (3) useMemo deps are [isEnabled, data, transactions, isLoading]: it re-runs per row on mount and whenever the tx array identity changes (every fetchAndUpdateAccountThunk), not on every render. Fix caveats: option (a) a memoized selector must be per-accountKey (createSelector with a parameter has cache size 1 and will thrash between accounts — use a weak/instance-per-key memo, e.g. the repo's memoizeWithArgs-style helper); option (b) hoisting into TransactionList means TxDetailModal.tsx:103 (a legitimate single-instance caller) still needs its own call, so keep the hook exported. Separately, the cheap independent fix in this file is hoisting `const lowerDescriptor = descriptor.toLowerCase();` above the `details.vin.some(...)` at transactionUtils.ts:76-81 — pure constant-factor, no behaviour change, no companion edits. getOwnEvmNonceSets itself has 3 other callers (:173, :226, :252) that are once-per-call and unaffected.

- Spans more than one file — see also `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103 (and packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:86)`.

- ⚠️ `suite-common/wallet-utils/src/transactionUtils.ts` already has an anchor filed as **#31131**. Check whether this should extend that issue instead of being filed fresh.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
