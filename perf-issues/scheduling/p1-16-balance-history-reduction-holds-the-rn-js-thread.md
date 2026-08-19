# `getAccountHistoryMovementFromTransactions` folds the account's whole transaction list in one task on the React Native JS thread

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. The mobile portfolio and account-detail graphs compute their balance history locally for every EVM, XRP and XLM account: one synchronous `forEach` over the account's transactions, allocating BigNumbers per input, per output, per internal transfer and per token transfer. It runs on the JS thread of the screen the user is looking at, on Hermes, and it never gives that thread back until the last transaction is folded.

## Where

[`suite-common/graph/src/graphDataFetching.ts:180`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L180) is the call site, inside the `getBalanceHistory` closure that starts at [`:165`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L165). The transactions come from `fetchTransactionsFromNowUntilTimestamp` at [`:173`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L173).

The loop itself is in [`suite-common/graph/src/balanceHistoryUtils.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts). The exported dispatcher at [`:320`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L320) switches on the symbol into one of three implementations, each of which is a single `transactions.forEach` with no boundary in it:

- [`getAccountHistoryMovementItemBTC`, `:21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L21) — loop at [`:28`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L28).
- [`getAccountHistoryMovementItemMisc`, `:91`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L91) (`xrp`, `xlm`) — loop at [`:98`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L98).
- [`getAccountHistoryMovementItemETH`, `:139`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L139) — loop at [`:147`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L147). This is the expensive one and the one that actually runs for the local-balance-history networks: per transaction it walks `details.vout`, `ethereumSpecific.internalTransfers`, `details.vin` and finally `tx.tokens` at [`:243`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L243), constructing a fresh `BigNumber` at nearly every step.

There is a **second** call site with the same shape: [`suite-common/graph/src/graphBalanceEvents.ts:155`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphBalanceEvents.ts#L155), inside `getAccountMovementEvents`, which builds the graph's transaction-event markers. On the account-detail screen both run over the same transaction list, because [`AccountDetailGraph.tsx:50`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L50) passes the account as `eventsAccount`, so `fetchGraphData` calls the points path and then the events path.

Which networks reach this branch is fixed by `LOCAL_BALANCE_HISTORY_COINS` at [`constants.ts:7`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/constants.ts#L7): `eth`, `pol`, `bsc`, `xrp`, `arb`, `avax`, `base`, `op`, `rhc`, `hype`, `xlm`. Everything else asks Blockbook for a pre-aggregated history instead.

## Before

The loop, verbatim, at [`balanceHistoryUtils.ts:139`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L139) (only the head is shown; the body runs to `:303`):

```ts
const getAccountHistoryMovementItemETH = ({
    transactions,
    from,
    to,
}: GetAccountHistoryMovementItemParams): AccountHistoryMovement => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();
    const allTokensSummaryMap = new Map<TokenAddress, typeof summaryMap>();

    transactions.forEach(tx => {
        const { blockTime } = tx;

        if (!blockTime || tx.ethereumSpecific === undefined) {
            return;
        }
```

and the call site, verbatim, at [`graphDataFetching.ts:172`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L172):

```ts
if (isLocalBalanceHistoryCoin(symbol)) {
    const allTransactions = await dispatch(
        fetchTransactionsFromNowUntilTimestamp({
            accountKey,
            timestamp: startOfTimeFrameDateTimestamp,
        }),
    ).unwrap();

    const movements = getAccountHistoryMovementFromTransactions({
        transactions: allTransactions,
        symbol,
    });

    tokensFilter?.forEach(tokenAddress => {
        // if there are no movements for this token, we need to add an empty array otherwise it will be skipped
        if (!movements.tokens[tokenAddress]) {
            movements.tokens[tokenAddress] = [];
        }
    });

    return movements;
}
```

## After

A batched iteration helper next to the three implementations in `balanceHistoryUtils.ts`:

```ts
import { BigNumber, yieldToMain } from '@trezor/utils';
```

```ts
const TRANSACTIONS_PER_BATCH = 200;

// The reduction runs on the JS thread of the screen the user is looking at, so it hands control
// back between batches instead of holding the thread for the whole history. On React Native
// yieldToMain resolves through setTimeout, because Hermes has no scheduler.yield and setImmediate
// is a microtask there.
const forEachTransactionInBatches = async (
    transactions: WalletAccountTransaction[],
    reduceTransaction: (tx: WalletAccountTransaction) => void,
) => {
    for (let i = 0; i < transactions.length; i += TRANSACTIONS_PER_BATCH) {
        if (i > 0) await yieldToMain();

        transactions.slice(i, i + TRANSACTIONS_PER_BATCH).forEach(reduceTransaction);
    }
};
```

Each implementation becomes `async` and awaits the helper; the callback body is unchanged, including its `return` early-exits:

```ts
const getAccountHistoryMovementItemETH = async ({
    transactions,
    from,
    to,
}: GetAccountHistoryMovementItemParams): Promise<AccountHistoryMovement> => {
    const summaryMap = new Map<BlockTime, AccountHistoryMovementItem>();
    const allTokensSummaryMap = new Map<TokenAddress, typeof summaryMap>();

    await forEachTransactionInBatches(transactions, tx => {
        const { blockTime } = tx;

        if (!blockTime || tx.ethereumSpecific === undefined) {
            return;
        }
```

`getAccountHistoryMovementItemBTC` ([`:21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L21)) and `getAccountHistoryMovementItemMisc` ([`:91`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L91)) take the identical change. The dispatcher then becomes `async` so every branch — including the exhaustiveness `throw` — resolves the same way:

```ts
export const getAccountHistoryMovementFromTransactions = async ({
    transactions,
    symbol,
    from,
    to,
}: {
    transactions: WalletAccountTransaction[];
    // We need to revaluate if we want to calculate BTC history from transactions or use blockbook
    symbol: LocalBalanceHistoryCoin | 'btc';
    from?: number;
    to?: number;
}): Promise<AccountHistoryMovement> => {
```

Both call sites gain an `await` and nothing else — they already sit inside `async` closures ([`graphDataFetching.ts:165`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L165) and [`graphBalanceEvents.ts:141`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphBalanceEvents.ts#L141)):

```ts
const movements = await getAccountHistoryMovementFromTransactions({
    transactions: allTransactions,
    symbol,
});
```

`yieldToMain` is the shared helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`) — `scheduler.yield()` when it exists, `setTimeout(resolve, 0)` otherwise. `@suite-common/graph` already depends on `@trezor/utils` (it imports `BigNumber` from it in this very file), so no new dependency edge.

## Why it matters

The user is on the Home screen watching the portfolio graph load, or has just tapped into an account and is looking at the account-detail graph with the transaction list rendering underneath it.

**What `n` is.** `fetchTransactionsFromNowUntilTimestamp` ([`transactionsThunks.ts:802`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L802)) returns every transaction of the account newer than the start of the timeframe — `selectAccountTransactionsFromNowUntilTimestamp` ([`transactionsSelectors.ts:350`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsSelectors.ts#L350)) is a plain filter on `blockTime`. For the fixed timeframes that bounds `n` by the window. For the **"All"** option ([`TimeSwitch.tsx:24`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/components/TimeSwitch.tsx#L24), `valueBackInHours: null`) the timestamp is `null` and the thunk short-circuits to `fetchAllTransactionsForAccountThunk` at [`:810`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L810) — the account's entire history, with no ceiling other than how much the user has transacted.

**How many times it runs per fetch.** On the account-detail screen, twice over the same array: once for the points, once for the event markers. On the Home screen, once per non-ignored mainnet account of the device — `getMultipleAccountBalanceHistoryWithFiat` maps them through `Promise.all` at [`graphDataFetching.ts:358`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L358), which parallelises the network round trips but not the CPU: the reductions still run back to back on the one JS thread.

**What is held.** The React Native JS thread, on Hermes, which has no JIT — the interpreted `BigNumber.plus` chains cost far more here than the same code costs in the desktop renderer. While that thread is held, nothing that needs JavaScript happens: `FlashList` cannot fill a recycled cell, a press handler cannot run, a Redux update from an incoming block cannot commit, and the JS half of a navigation gesture cannot respond. With the new architecture already-mounted views still scroll on the UI thread, so the freeze is not always total — but everything that has to reach JS waits for the last transaction of the fold.

**After the fix** the thread comes back every `TRANSACTIONS_PER_BATCH` transactions and the queued native events run in between. The graph appears at the same time or marginally later; it is already behind a loading state (`selectAccountGraphIsLoading`), so the user sees no new intermediate state.

**Honest sizing.** Three things make this smaller than the raw shape suggests, and a reviewer should weigh them:

- **The default timeframe is one month** (`DEFAULT_GRAPH_TIMEFRAME_HOURS = 720`, [`slice.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/slice.ts#L17)). On the default path `n` is a month of transactions for one account, which for most wallets is small. The unbounded case is a heavy account plus the "All" tab, and the "1y" tab in between.
- **The points path is cached.** `accountBalanceHistoryCache` ([`graphDataFetching.ts:138`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L138)) keys on the account item and both timeframe bounds ([`:160`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L160)), and the end bound is `new Date()` rounded down to ten minutes ([`graphUtils.ts:171`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphUtils.ts#L171)). So "runs on every Home mount" is an overstatement — it runs on the first mount in each ten-minute bucket, on every timeframe switch, and on every `forceRefetch` (pull-to-refresh at [`useHomeRefreshControl.tsx:27`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-home/src/screens/HomeScreen/useHomeRefreshControl.tsx#L27), the account-detail retry at [`AccountDetailGraph.tsx:80`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L80), the transaction-list refresh at [`TransactionList.tsx:199`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L199)). The **events** path in `graphBalanceEvents.ts` has **no cache at all**, so that pass really does run on every account-detail fetch.
- **Yielding does not make it faster.** Total CPU goes up slightly (batch slicing, timer turns). The claim is that the app stays responsive while it runs, which is a different and — for a screen the user is touching — better claim.

## Notes

- **The `After` has not been compiled or run.** It is written against the real types by reading them: `WalletAccountTransaction` and `AccountHistoryMovement` are already imported at [`balanceHistoryUtils.ts:1`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.ts#L1) and `:6`.
- **On this repo's React Native, `setImmediate` does not yield — it is a microtask.** Verified in the installed source: with bridgeless (new architecture) enabled, `Libraries/Core/setUpTimers.js` polyfills `setImmediate` from `Libraries/Core/Timers/immediateShim.js`, which is literally `global.queueMicrotask(...)`. Android sets `newArchEnabled=true` explicitly (`suite-native/app/android/gradle.properties:38`) and bridgeless is the default on the installed RN 0.86.0 (`suite-native/app/package.json:145` pins `0.85.3`). So the only primitive in the After that actually ends the task is `setTimeout(fn, 0)`, and `yieldToMain` must be allowed to take its fallback branch here. **This corrects the raw finding and `_doc-instructions.md`, both of which offer `setImmediate` as an alternative to `setTimeout(0)` on Hermes — it is not one.** It also makes `InteractionManager.runAfterInteractions` useless for this defect on two counts, not one: on top of being a deprecated stub, the `setImmediate` it wraps would not break the task.
- **`requestIdleCallback` does exist on this React Native, contrary to `skills/performance-scheduling/SKILL.md`.** Same file: bridgeless installs `requestIdleCallback` / `cancelIdleCallback` from `src/private/webapis/idlecallbacks/specs/NativeIdleCallbacks.js` (`NativeIdleCallbacksCxx`), whose spec has `RequestIdleCallbackOptions = { timeout?: number }` and an `IdleDeadline` with `didTimeout` and `timeRemaining()` — i.e. the web shape including the timeout the skill insists on. The bridge path polyfills it from `JSTimers` too. **This is not used by this issue** (graph data is work the user is actively waiting for, not deferrable), but it is worth flagging into the skill and the writer brief: the "React Native has neither API, so use `InteractionManager`" rule is wrong on both halves, and the native documents in this sweep that defer non-essential work may have a better lever available than they were told.
- **`TRANSACTIONS_PER_BATCH = 200` is a guess, not a measurement.** Nothing here was profiled. It was picked so that a batch is small enough that even the EVM branch's per-transaction BigNumber work stays well inside one frame budget on a mid-range Android, and large enough that a one-month history usually finishes in one or two batches and pays no timer turns at all. If the per-transaction cost turns out to be much lower than assumed, raise it.
- **Cancellation is deliberately not threaded through.** A long "All"-timeframe reduction will still run to completion after the user leaves the screen. Adding an abort would mean passing a signal from `suite-native/graph` into `@suite-common/graph`, and the natural guard — the `lastFetchTimestamps` check at [`graphThunks.ts:119`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/graphThunks.ts#L119) — lives in the native package, which `suite-common` may not import. An `AbortSignal` parameter on `getAccountHistoryMovementFromTransactions` would be the clean way and is a fair thing for a reviewer to ask for; it is left out here to keep the change to one shape.
- **Re-entrancy.** The fold is pure — a `Map` keyed by `blockTime`, sorted only at the end — so batching cannot change the result. What batching does open is a window for a second `refetchGraphThunk` to interleave. That is already guarded: `fetchTransactionsFromNowUntilTimestamp` is a `createSingleInstanceThunk`, and a superseded fetch is discarded by the timestamp check at [`graphThunks.ts:119`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/graphThunks.ts#L119) before anything is written to the atoms. Note the guard sits _after_ `jotaiStore.set(atoms.graphEventsAtom, events)` at [`:116`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/graphThunks.ts#L116), so a superseded fetch can still write stale **events** — that ordering bug exists today and this change makes the window wider. Worth fixing in the same PR.
- **Tests.** The only tests that touch this code are in [`suite-common/graph/src/balanceHistoryUtils.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.test.ts), and every case already writes `await getAccountHistoryMovementFromTransactions(...)` ([`:16`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/balanceHistoryUtils.test.ts#L16) and eight more) even though the function is synchronous today — so they should pass unchanged. `graphBalanceEvents.test.ts` only exercises the pure formatting helpers. There are no fake timers anywhere in the package, so the `setTimeout(0)` resolves normally. The fixtures are far under 200 transactions, which means the batching gets no coverage; a test asserting the yield would have to count event-loop turns and is probably not worth writing.
- **Package impact.** `@suite-common/graph` is `private: true`, so nothing here is published API. Adding `yieldToMain` to `@trezor/utils` (published, `10.0.0-beta.1`) is a published-API addition, shared with the rest of this sweep.
- **Platform: native only, despite living in `suite-common`.** Every importer of `@suite-common/graph` is under `suite-native/` (`suite-native/graph`, `suite-native/module-accounts-management`); nothing in `packages/suite` reaches this code. The web dashboard graph is a separate implementation, `packages/suite/src/utils/wallet/graph/utilsWorker.ts`, which is **p2-07** in this set. So there is no Safari fallback question and no desktop benefit to claim.
- **Deliberately not changed: the duplicated pass.** `getAccountMovementEvents` re-derives the same movements from the same transaction array that `getAccountBalanceHistory` just derived. Computing once and sharing would remove half the work on the account-detail screen outright, which is a bigger win than yielding — but it changes the shape of `fetchGraphData` and belongs in its own issue. A reviewer may reasonably want that one first and this one second, or may want both in one PR.
- **Also deliberately not changed:** `addBalanceForAccountMovementHistory` ([`graphDataFetching.ts:40`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L40)), which sorts and re-walks the movement points with a BigNumber per point. Its `n` is distinct block times rather than transactions, so it is strictly smaller, but it is the next thing to chunk if the fold turns out not to be the whole cost. The unbounded module-level `accountBalanceHistoryCache` at [`:138`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L138) is a memory concern, not a scheduling one, and is out of scope here.
- **Cross-references.** **p1-17** defers the graph refetch in `useGraphData` so this whole pipeline does not start during the navigation transition — the two compose, and if p1-17 lands first this work no longer collides with the push animation, which weakens (but does not remove) the case here. **p2-13** is the native transaction list rebuilding on the same screen at the same time.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
