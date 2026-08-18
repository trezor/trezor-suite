# `saveAccountHistoricRates` re-derives rates from the whole account history on every page — persist only the transactions that changed

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/suite/src/actions/suite/storageActions.ts:341`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L341) (also 338,339) — `saveAccountHistoricRates`

`accTxs` is the account's full transaction list; `historicRates` is the entire `wallet.fiat.historic` map (one key per symbol/token/currency pair, each holding a timestamp->rate record).

## Before

```ts
        if (!db.isAccessible()) return Promise.resolve();
        const allTxs = getState().wallet.transactions.transactions;
        const accTxs = (allTxs[accountKey] || []).filter(isNotNullOrUndefined);

        const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);

        return db.addItem('historicRates', accHistoricRates, accountKey, true);
    };

export const saveAccountTransactions =
    (account: Account) => (_dispatch: Dispatch, getState: GetState) => {
```

## After

Pass the just-updated txs through instead of re-deriving from the whole account: `updateTxsFiatRatesThunk.fulfilled` already knows which transactions it fetched rates for, so merge those keys into the stored record (read-modify-write of the existing `historicRates` entry) rather than recomputing the account-wide map from `wallet.transactions` on every batch.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(pages x N x R) with the current inner scan, O(pages x N) = O(N^2/25) even after fiatRatesUtils.ts:119 is indexed; N = account transactions, R = keys in wallet.fiat.historic`** — warm path.

storageMiddleware.ts:196 fires this on every `updateTxsFiatRatesThunk.fulfilled`, and that thunk is dispatched once per `addTransaction` batch (suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:57). So paging a 10,000-tx account (400 pages) re-walks all 10,000 txs 400 times, each walk also re-deriving and re-writing the whole `historicRates` IDB record after `removeAccountHistoricRates`. This is a separate defect from the already-filed inner nested scan in fiatRatesUtils.ts: even if that inner loop is indexed to O(1) per tx, the outer full-history walk per rate batch remains O(N) per page = O(N^2/perPage) overall.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- OVERLAPS with the already-reported suite-common/wallet-utils/src/fiatRatesUtils.ts:119 (`typedObjectKeys(historicRates).forEach` inside `txs.forEach`, plus `typedObjectKeys` re-materialised inside the loop body). If both are filed, cross-link them: fixing only :119 leaves the quadratic paging behaviour intact, and fixing only this one leaves the inner O(N x R) intact. Consider folding this into the existing fiatRatesUtils issue as 'the caller is also quadratic'. Same remembered-device gate as the previous finding (storageMiddleware.ts:320) — unremembered wallets never hit it. Behaviour note for the fix: `removeAccountHistoricRates` + full re-derive is currently what prunes rate entries belonging to txs that disappeared. A read-modify-write delta merge would stop pruning, so the issue should say the pruning needs to move somewhere else (e.g. `removeTransaction` / `fetchAllTransactionsForAccountThunk.fulfilled`) rather than just be dropped.

- Spans more than one file — see also `packages/suite/src/middlewares/wallet/storageMiddleware.ts:196`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
