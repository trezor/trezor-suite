# Every transaction page deletes and rewrites the account's entire persisted history — coalesce the IDB writes instead of running them per page

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle on a non-array-method surface; the closest rule is _"Index by key before iterating, don't scan inside a loop"_, except the inner "scan" here is a full delete-and-rewrite of an IndexedDB object store. `fetchAllTransactionsForAccountThunk` pages a history 25 transactions at a time and dispatches `addTransaction` per page; the storage middleware answers each of those dispatches by cursor-deleting _every_ persisted row for the account and putting _every_ row back.

## Where

- [`packages/suite/src/middlewares/wallet/storageMiddleware.ts:178`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L178) — transaction rows
- [`packages/suite/src/middlewares/wallet/storageMiddleware.ts:193`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L193) — the sibling handler for historic fiat rates

Both handlers treat a _delta_ action (`addTransaction` for one page, `updateTxsFiatRatesThunk.fulfilled` for one batch of rates) as a trigger to re-materialise the account's whole persisted state. The cost of persisting page _k_ is therefore proportional to everything persisted by pages 1.._k_, not to the 25 rows that actually changed.

## Before

### 1. Transaction rows — delete-all then re-put-all, once per page

`storageMiddleware.ts:168-181`:

```ts
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.addTransaction.match,
            transactionsActions.removeTransaction.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, { dispatch }) => {
            const { account } = action.payload;

            storageActions.removeAccountTransactions(account);
            dispatch(storageActions.saveAccountTransactions(account));
        },
    }),
```

`removeAccountTransactions` (`storageActions.ts:218`) goes through `db.removeItemByIndex('txs', 'accountKey', …)`, which opens a cursor on the index and awaits one `cursor.delete()` per row (`packages/suite-storage/src/index.ts:203-218`). `saveAccountTransactions` (`storageActions.ts:346`) then rebuilds the wrapper array for the whole account and puts every row back:

```ts
// wrap txs and add its order inside the array
const orderedTxs = accTxs.map((tx, order) => ({ tx, order })).filter(({ tx }) => !!tx);
const transactionsPromise = db.addItems('txs', orderedTxs, true);
```

### 2. Historic fiat rates — the same rewrite, once per rate batch

`storageMiddleware.ts:193-217`:

```ts
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.removeTransaction.match,
            updateTxsFiatRatesThunk.fulfilled.match,
        ],
        getDevice: (action, state) => {
            const { account } = action.payload;

            return account ? getDeviceByAccountKey(account.key, state) : undefined;
        },
        save: ({ action }, { dispatch, getState }) => {
            const { account } = action.payload;

            if (!account) {
                return;
            }

            storageActions.removeAccountHistoricRates(account.key);

            const historicRates = selectHistoricFiatRates(getState());
            if (historicRates) {
                dispatch(storageActions.saveAccountHistoricRates(account.key, historicRates));
            }
        },
    }),
```

`saveAccountHistoricRates` (`storageActions.ts:334-344`) re-derives the account-wide rate map from _all_ of `wallet.transactions.transactions[accountKey]` via `selectHistoricRatesByTransactions` before writing it back. `updateTxsFiatRatesThunk` is dispatched once per `addTransaction` batch (`suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:49-63`), so this fires once per page too.

## After

Do not attempt a delta write (see Notes — `order` makes that unsafe). Coalesce instead: keep the existing full-rewrite semantics, but collapse the per-page storms into one leading write plus one trailing write per interval, per account. `Throttler` from `@trezor/utils` is exactly this primitive and is already used in `blockchain-link` and `transport-bridge`.

### 0. A per-account write coalescer (new, near the other helpers at the top of the file)

```ts
import { Throttler } from '@trezor/utils';

// Persisting an account's transactions is a delete-all + re-put-all of every row, and persisting its
// historic rates re-derives the whole rate map, so neither may run once per page of
// fetchAllTransactionsForAccountThunk. Coalesce per account: the first write goes through
// immediately, subsequent ones collapse into a single trailing write per interval.
const STORAGE_WRITE_THROTTLE_MS = 1000;
const accountStorageThrottler = new Throttler(STORAGE_WRITE_THROTTLE_MS);

const throttleAccountTransactionsWrite = (account: Account, dispatch: Dispatch) =>
    accountStorageThrottler.throttle(`txs-${account.key}`, () => {
        storageActions.removeAccountTransactions(account);
        dispatch(storageActions.saveAccountTransactions(account));
    });

const throttleAccountHistoricRatesWrite = (
    accountKey: AccountKey,
    dispatch: Dispatch,
    getState: GetState,
) =>
    accountStorageThrottler.throttle(`historicRates-${accountKey}`, () => {
        storageActions.removeAccountHistoricRates(accountKey);

        const historicRates = selectHistoricFiatRates(getState());
        if (historicRates) {
            dispatch(storageActions.saveAccountHistoricRates(accountKey, historicRates));
        }
    });

// A pending trailing write would resurrect rows that were just deleted, so every explicit removal
// has to cancel it first.
const cancelAccountStorageWrites = (accountKey: AccountKey) => {
    accountStorageThrottler.cancel(`txs-${accountKey}`);
    accountStorageThrottler.cancel(`historicRates-${accountKey}`);
};
```

### 1. Transaction rows

```ts
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.addTransaction.match,
            transactionsActions.removeTransaction.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, { dispatch }) => {
            throttleAccountTransactionsWrite(action.payload.account, dispatch);
        },
    }),
```

### 2. Historic fiat rates

```ts
        save: ({ action }, { dispatch, getState }) => {
            const { account } = action.payload;

            if (!account) {
                return;
            }

            throttleAccountHistoricRatesWrite(account.key, dispatch, getState);
        },
```

### 3. Cancel pending writes wherever the account's rows are deleted outright

`storageMiddleware.ts:333-339`, in the middleware body:

```ts
if (transactionsActions.resetTransaction.match(action)) {
    const { account } = action.payload;

    cancelAccountStorageWrites(account.key);
    storageActions.removeAccountTransactions(account);
    storageActions.removeAccountHistoricRates(account.key);
    storageActions.removeAccountPhishing(account.key);
}
```

and, immediately above it, for `accountsActions.removeAccount`:

```ts
if (accountsActions.removeAccount.match(action)) {
    action.payload.forEach(({ key }) => cancelAccountStorageWrites(key));
    action.payload.forEach(storageActions.removeAccountWithDependencies(api.getState));
}
```

## Why it matters

Both handlers are **O(pages × N)** where _N_ is the account's full transaction history — i.e. **O(N²/perPage)** across one history load. `perPage` is `getTxsPerPage(networkType)`, which is `DEFAULT_TXS_PER_PAGE = 25` for everything except Cardano and Solana (`suite-common/suite-utils/src/txsPerPage.ts`, `packages/connect-common/src/constants/paging.ts`).

For a 10 000-transaction account, `fetchAllTransactionsForAccountThunk` (`suite-common/wallet-core/src/transactions/transactionsThunks.ts:714-790`) runs 400 pages. Counting only the rows actually present at each page, that is Σ<sub>k=1..400</sub> 25k ≈ **2·10⁶ cursor deletes, 2·10⁶ puts, and 2·10⁶ `{ tx, order }` wrapper allocations** for a single account load — each put structured-cloning a full `WalletAccountTransaction`, all issued from the main thread. The historic-rates handler adds 400 more delete/put round-trips, each preceded by a re-derivation of the whole rate map over the same 2·10⁶ cumulative transaction visits (× _R_ rate keys, since `selectHistoricRatesByTransactions` scans every key per transaction — that inner loop is p1-08 / `fiatRatesUtils.ts:119`).

Entry point is the ordinary one: opening an account's transaction list (`useFetchTransactions.ts:79`), the CSV export action, and the ETH/ADA staking dashboards all dispatch `fetchAllTransactionsForAccountThunk`.

Gate on this before grading: the handlers only run when `getIsDeviceRemembered(device)` is true (`storageMiddleware.ts:320`). Standard/unremembered wallets never persist transactions and are unaffected — but a remembered wallet is the normal configuration for anyone who uses Suite regularly.

For scale calibration on a _different_ defect of the same shape: #31123 measured 322 ms at n=2000 for the quadratic fiat-rates reducer. Nothing in this issue was benchmarked.

## Notes

- **This and p1-01 (`transactionsReducer.ts:71`) share one trigger.** Every `addTransaction` dispatch from the paging loop pays a linear scan of the whole stored array per incoming transaction _in the reducer_, and then this full rewrite _in the middleware_. They should be fixed together, or at least filed as siblings — coalescing the persistence here blunts half the cost on its own.
- **The obvious delta write is not safe.** `txs` rows carry `order` = the transaction's index inside the state array (`storageActions.ts:353`), and `preloadStore.ts:75` reads them back with `db.getItemsExtended('txs', 'order')` — so `order` is load-bearing for list ordering on reload. A new pending transaction is _prepended_, shifting `order` for every existing row, so writing only the changed rows would leave stale/duplicate `order` values and corrupt the restored order. That leaves three directions: (a) write the affected index range plus every shifted row, (b) **coalesce the writes**, as above, (c) drop positional `order` and derive ordering from `blockTime`/`txid` at load. (b) is the smallest change with zero semantic delta; (c) is the real fix but is a storage migration.
- **Coalescing keeps the pruning semantics intact**, which a delta merge would not. `removeAccountHistoricRates` + full re-derive is currently the _only_ thing that prunes rate entries belonging to transactions that have disappeared; likewise the cursor delete is what removes stale `txs` rows. Throttling changes when those run, not what they do.
- **Read state inside the callback, not outside it.** `saveAccountHistoricRates` takes the rate map as an argument, so the `getState()` call must stay inside the throttled closure (as written above) or the trailing write persists a stale snapshot. `saveAccountTransactions` already reads `getState().wallet.transactions` at dispatch time, so it is safe; the captured `account` is only used for the identity tuple (`descriptor`, `symbol`, `deviceState`, `key`), which does not change.
- **Behaviour delta: a crash or quit inside the throttle window loses up to `STORAGE_WRITE_THROTTLE_MS` of persistence.** Transactions are re-fetched from the backend on the next load, so this is a cache freshness question, not data loss. If that is judged unacceptable, add a flush on `beforeunload` / app-quit rather than lowering the interval.
- **`Throttler` is leading-edge**: the first call for a given id runs synchronously, further calls within the interval are replaced (last-wins) and fire on the next tick, and the interval self-cancels once no callback is pending — so the final state is always written. Verify this against `packages/utils/src/throttler.test.ts` rather than trusting the summary.
- **Cancellation is mandatory, not optional.** `resetTransaction` (`storageMiddleware.ts:333`), `accountsActions.removeAccount` (`:325`) and `storageActions.forgetDevice` all delete rows outright; a trailing write scheduled just before any of them would put the rows straight back. `forgetDevice` lives in `storageActions.ts` and cannot reach a middleware-local throttler, so either the throttler moves next to the storage actions or the device's accounts are cancelled from the middleware's `deviceActions.forgetDevice` branch (`storageMiddleware.ts:419`).
- **`markTransactionAsNotScam` (`storageMiddleware.ts:182-191`) is deliberately left unthrottled** — it is user-initiated, one per interaction, and writes without the preceding delete. It cannot race destructively with a pending throttled write (the pending write re-reads state, which already carries the flag), but routing it through the same key would be tidier.
- **Types.** `Account` is not currently imported into `storageMiddleware.ts` — add it to the existing `import { type AccountKey } from '@suite-common/wallet-types';`. `AccountKey`, `Dispatch` and `GetState` are already imported (lines 54 and 61). Throttler ids are template literals over `AccountKey`, which is a branded string, so `` `txs-${account.key}` `` widens to `string` cleanly; `Throttler`'s maps are `{ [id: string]: … }` so `noUncheckedIndexedAccess` is not an issue at the call site. `@trezor/utils` is already a dependency of `packages/suite` (`package.json:169`).
- **No test covers the middleware handler at `:175-180` with a remembered device.** `packages/suite/src/actions/suite/storageActions.test.ts` wires the real `storageMiddleware` (line 37), but both transaction tests (`'should store remembered device'`, `'should remove all txs for the acc'`) dispatch `addTransaction` _before_ `rememberDevice`, so persistence happens through `rememberDevice` and the handler never fires. Worth adding a test that dispatches `addTransaction` for an already-remembered device and asserts the rows land. Note that a module-level `Throttler` holds state across tests in a file — it needs `dispose()` in `afterEach`, or to be created per store.
- **Related anchors and issues.** The historic-rates half overlaps p1-08 (`suite-common/wallet-utils/src/fiatRatesUtils.ts:119`, the O(N × R) inner scan) and p2-14 (`packages/suite/src/actions/suite/storageActions.ts:341`, the caller). Fixing only the inner scan leaves the per-page rewrite intact; fixing only this leaves the inner scan intact. If p2-14 is filed separately, cross-link them — or fold p2-14 into this issue, since its `n grows because` clause points straight back at `storageMiddleware.ts:196`.
- Size: medium. (b) as written is a contained change; (c), the `order` redesign, is a separate storage migration and should not be bundled in.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
