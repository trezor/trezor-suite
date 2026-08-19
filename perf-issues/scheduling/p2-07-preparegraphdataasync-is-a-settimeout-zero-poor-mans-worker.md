# `prepareGraphDataAsync` wraps the whole dashboard aggregation in one `setTimeout(…, 0)`, so the work still runs as a single uninterruptible task — one tick later

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and
yield to the main thread"_. This is the one call site in the set where somebody already saw the problem
and reached for the wrong primitive: the function is named `…Async`, lives in a file named
`utilsWorker.ts`, and carries a comment asserting it does the work "without lagging the renderer
thread". It does none of those things. A single `setTimeout(0)` moves a long task; it does not break one
up. And the skill names this exact primitive as the fallback, not the goal.

## Where

[`packages/suite/src/utils/wallet/graph/utilsWorker.ts:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L138)
— `prepareGraphDataAsync`, whose entire body is one
[`window.setTimeout(…, 0)`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L143)
wrapped in a `Promise`. Inside that one timer callback it runs
[`getGraphDataForInterval`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L367)
(a full pass over every point of every account, with a `fromUnixTime` `Date` per point when a range is
selected, [`utils.ts:367-397`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L367-L397))
and then
[`aggregateBalanceHistory`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L32),
a nested `for` over accounts
([`:39`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L39))
and `forEach` over each account's points
([`:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L44)),
finishing with an `Object.keys(...).flatMap(...).sort(...)` over the bins
([`:118-124`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L118-L124)).
Nothing in that chain yields.

The single call site is the dashboard graph effect,
[`packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx:94-114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx#L94-L114),
which depends on the whole `graph` slice and re-runs whenever that slice's identity changes and
`isLoading` is false — a range click
([`GraphRangeSelector.tsx:110`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L110)
dispatches `SET_SELECTED_RANGE`, handled at
[`graphReducer.ts:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/graphReducer.ts#L131)),
the end of a refetch
([`AGGREGATED_GRAPH_SUCCESS`, `:128`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/graphReducer.ts#L128)),
the storage load, and account removal.

### The file has not run in a worker since July 2025

The filename, the `index.ts` banner and the trailing comments all still describe a worker that no longer
exists:

- [`packages/suite/src/utils/wallet/graph/index.ts:2`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/index.ts#L2)
  already says `TODO reorganize, because worker is no more`, while
  [`:13`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/index.ts#L13)
  still labels this file `Utilities specific to the worker process`.
- There is no `new Worker(` anywhere under `packages/suite/src`, and `utilsWorker.ts` is the only file
  there whose name mentions a worker.
- `window.setTimeout` at
  [`:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L143)
  could not run in a dedicated worker at all — there is no `window` in that scope.
- `git show e73342b980` (`chore(suite): refactor DashboardGraph from worker to async fn`, 2025-07-03)
  deleted `packages/suite/src/support/workers/graph/index.ts` and introduced the `setTimeout(0)` promise
  in its place. The same commit removed the effect's cleanup, which had called
  `worker.removeEventListener(...)` and `worker.terminate()`.

So the name is not just stale, it is actively misleading: a reader who greps for "why is the dashboard
graph slow" finds a file that promises the work is off-thread.

## Before

`packages/suite/src/utils/wallet/graph/utilsWorker.ts:134-150`:

```ts
/**
 * Poor man's substitute for web worker, but it does the job perfectly - does expensive calculations async without
 * lagging the renderer thread.
 */
export const prepareGraphDataAsync = ({
    graph,
    deviceState,
}: PrepareGraphDataAsyncProps): Promise<GraphDataPoint<'dashboard'>[]> =>
    new Promise(resolve => {
        window.setTimeout(() => {
            const history = getGraphDataForInterval({ deviceState, graph });
            const { groupBy } = graph.selectedRange;
            const type = 'dashboard';
            const aggregatedData = aggregateBalanceHistory(history, groupBy, type);
            resolve(aggregatedData);
        }, 0);
    });
```

`packages/suite/src/utils/wallet/graph/utilsWorker.ts:37-44` — the loop it calls; the `forEach` body runs
to `:113` and the bins are flattened and sorted at `:118-124`:

```ts
    const groupedByTimestamp: { [key: string]: GraphDataPoint<TType> } = {};

    for (let i = 0; i < graphData.length; i++) {
        // graph data for one account
        const accountHistory = graphData[i]?.data;

        if (accountHistory && accountHistory.length > 0) {
            accountHistory.forEach(h => {
```

`packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx:94-114`:

```tsx
useEffect(() => {
    if (!graph.isLoading) {
        setIsProcessing(true);

        prepareGraphDataAsync({ graph, deviceState: selectedDeviceState }).then(aggregatedData => {
            const graphTicks =
                graph.selectedRange.label === 'all'
                    ? calcTicksFromData(aggregatedData).map(getUnixTime)
                    : calcTicks(graph.selectedRange.startDate, graph.selectedRange.endDate).map(
                          getUnixTime,
                      );

            setData(aggregatedData);
            setXticks(graphTicks);
            setIsProcessing(false);
        });
    }
}, [graph, selectedDeviceState]);
```

## After

`yieldToMain()` is the shared helper introduced by whichever of these scheduling issues lands first —
proposed home `packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`: `scheduler.yield()`
when present, `setTimeout(resolve, 0)` otherwise. This file already imports from `@trezor/utils` at
[`:5`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L5),
so the import is one added specifier, and `AccountHistoryWithBalance` joins the existing type import at
[`:8-12`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L8-L12):

```ts
import { BigNumber, typedObjectFromEntries, typedObjectKeys, yieldToMain } from '@trezor/utils';
```

```ts
import {
    type AccountHistoryWithBalance,
    type AggregatedAccountHistory,
    type AggregatedDashboardHistory,
    type GraphData,
} from 'src/types/wallet/graph';
```

`:32` — the per-point body is lifted out unchanged (only `groupedByTimestamp` becomes the passed-in
`bins`), so the same code serves the synchronous and the chunked driver:

```ts
const AGGREGATION_BATCH_SIZE = 500;

type BinsByTimestamp<TType extends TypeName> = { [key: string]: GraphDataPoint<TType> };

const addPointsToBins = <TType extends TypeName>(
    bins: BinsByTimestamp<TType>,
    accountHistory: AccountHistoryWithBalance[],
    groupBy: 'day' | 'month',
    type: TType,
) => {
    accountHistory.forEach(h => {
        // Editorial marker, not proposed code: the body of :44-113 moves here verbatim, with
        // `groupedByTimestamp` renamed to `bins`.
    });
};

const sortBinsByTime = <TType extends TypeName>(
    bins: BinsByTimestamp<TType>,
): GraphDataPoint<TType>[] =>
    Object.keys(bins)
        .flatMap(timestamp => {
            const point = bins[timestamp];

            return point ? [point] : [];
        })
        .sort((a, b) => Number(a.time) - Number(b.time));

export const aggregateBalanceHistory = <TType extends TypeName>(
    graphData: GraphData[],
    groupBy: 'day' | 'month',
    type: TType,
): GraphDataPoint<TType>[] => {
    const bins: BinsByTimestamp<TType> = {};

    graphData.forEach(({ data }) => addPointsToBins(bins, data, groupBy, type));

    return sortBinsByTime(bins);
};

const aggregateBalanceHistoryInBatches = async <TType extends TypeName>(
    graphData: GraphData[],
    groupBy: 'day' | 'month',
    type: TType,
): Promise<GraphDataPoint<TType>[]> => {
    const bins: BinsByTimestamp<TType> = {};

    for (const { data } of graphData) {
        for (let i = 0; i < data.length; i += AGGREGATION_BATCH_SIZE) {
            addPointsToBins(bins, data.slice(i, i + AGGREGATION_BATCH_SIZE), groupBy, type);

            await yieldToMain();
        }
    }

    return sortBinsByTime(bins);
};
```

`:134` — the false JSDoc goes with the `setTimeout`:

```ts
/**
 * Aggregates the dashboard graph in batches, handing the main thread back between them so a long
 * history does not hold the renderer in one task.
 */
export const prepareGraphDataAsync = async ({
    graph,
    deviceState,
}: PrepareGraphDataAsyncProps): Promise<GraphDataPoint<'dashboard'>[]> => {
    await yieldToMain();

    const history = getGraphDataForInterval({ deviceState, graph });

    return aggregateBalanceHistoryInBatches(history, graph.selectedRange.groupBy, 'dashboard');
};
```

`DashboardGraph.tsx:94-114` — the aggregation now spans several tasks, so a run that is already obsolete
when it finishes must not be allowed to overwrite a newer one. This restores the guarantee
`e73342b980` dropped when it deleted the `worker.terminate()` cleanup:

```tsx
useEffect(() => {
    if (graph.isLoading) {
        return;
    }

    let isOutdated = false;

    setIsProcessing(true);

    prepareGraphDataAsync({ graph, deviceState: selectedDeviceState }).then(aggregatedData => {
        if (isOutdated) {
            return;
        }

        const graphTicks =
            graph.selectedRange.label === 'all'
                ? calcTicksFromData(aggregatedData).map(getUnixTime)
                : calcTicks(graph.selectedRange.startDate, graph.selectedRange.endDate).map(
                      getUnixTime,
                  );

        setData(aggregatedData);
        setXticks(graphTicks);
        setIsProcessing(false);
    });

    return () => {
        isOutdated = true;
    };
}, [graph, selectedDeviceState]);
```

## Why it matters

The user has just opened the dashboard, or clicked a range on the portfolio graph. `n` is the number of
balance-history points fed in: the backend is asked for daily buckets
([`graphActions.ts:120`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/graphActions.ts#L120)),
and it returns only the days that had activity — `calcFakeGraphDataForTimestamps`
([`utils.ts:264`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L264))
exists precisely to fabricate the empty days afterwards
([`:318`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L318)),
and `updateGraphData` treats `sum(point.txs)` as equal to `account.history.total`
([`graphActions.ts:218`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/graphActions.ts#L218),
[`:227`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/graphActions.ts#L227)).
So per account the point count is "days with transactions", bounded above by the transaction count — and
the dashboard sums that over **every** account of the selected device, because `getGraphDataForInterval`
is called with `deviceState` and no account filter.

Per point, inside the one task:

- a spread copy of the whole history entry, then three `calcFiatValueMap` calls
  ([`utilsWorker.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L18))
  for `received`, `sent` and `balance`. Each builds a fresh object over every symbol the backend attached
  rates for, and `BaseCurrencyCode` spans 46 codes — 43 fiat plus `btc`/`xag`/`xau`
  ([`baseCurrency.ts:3`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-types/src/baseCurrency.ts#L3),
  [`:49`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-types/src/baseCurrency.ts#L49),
  [`:57`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-types/src/baseCurrency.ts#L57));
- one `new BigNumber(...).times(rate)` per entry of each of those three maps
  ([`fiatConverterUtils.ts:28`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/fiatConverterUtils.ts#L28));
- a `fromUnixTime` `Date` and a template-literal bin key;
- and when the point lands in a bin that already exists — which, with per-day data binned by day across
  many accounts and by month for the longer ranges, is the common case — three `sumFiatValueMapInPlace`
  passes, each doing another `new BigNumber(previousValue).plus(val)` per symbol
  ([`utilsShared.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsShared.ts#L17)).

That is a few hundred `BigNumber` constructions per point, times every point of every account, with no
yield anywhere. The `setTimeout(0)` decides _when_ that task starts, not how long it holds the thread.

### The arithmetic that picks the yield primitive

The naive way to chunk this is to keep reaching for the primitive already in the file — schedule each
batch with `setTimeout(…, 0)`. That is the fallback the skill warns about, and here is why it matters at
this size. Timers scheduled from inside timer callbacks nest, and past five levels of nesting each one is
clamped to a 5 ms floor, so a chunked run pays roughly:

`dead time ≈ (chunks − 5) × 5 ms`, with `chunks = ceil(points / 500)`

| points | chunks at 500/batch | clamp time added |
| ------ | ------------------- | ---------------- |
| 2,500  | 5                   | none             |
| 5,000  | 10                  | ~25 ms           |
| 20,000 | 40                  | ~175 ms          |
| 50,000 | 100                 | ~475 ms          |

And the knob works against itself: halving the batch to 250 to keep each task short doubles the chunk
count and roughly doubles the dead time — 20,000 points would go from ~175 ms to ~375 ms of pure waiting.
`scheduler.yield()` has no such floor and resumes at the **front** of the queue, so batch size trades only
against per-batch task length, which is the trade you actually want to make. That is the whole reason the
`After` routes the yield through `yieldToMain` rather than open-coding `setTimeout` in the loop. These
numbers are arithmetic from the spec'd clamp, not a measurement of this code.

### What changes for the user

Today: the dashboard is unresponsive for the length of one task that starts a tick after the effect runs
— clicks, hovers and scrolls on the dashboard queue behind it. After: the graph appears at roughly the
same moment or slightly later (the yields are real ticks), and everything else on the dashboard stays
live while it computes. On a range switch nothing flashes, because `TransactionsGraph` only shows the
skeleton when there is no data at all
([`TransactionsGraph.tsx:102`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L102))
— the previous graph simply stays on screen a little longer before it swaps.

## Notes

- **The `After` hunks have not been compiled**, and the extracted `addPointsToBins` body is described
  rather than reproduced so the diff stays readable. Prettier will reflow the `calcTicks` ternary once
  the effect loses an indent level; the shape shown is a guess at where it breaks, not a claim.
- **`n` is smaller than the file's reputation suggests, and this is a tail fix.** A user with a handful
  of accounts and a few hundred transactions produces a few hundred points and never gets near a long
  task; the argument is about devices with many accounts and years of history. A reviewer could
  reasonably ask for the chunked path to be skipped below some point count so the common case does not
  pay for yields it does not need — that is a fair amendment, not an objection.
- **The strongest push-back is that this recomputes from scratch at all.** The effect depends on the
  whole `graph` slice and re-derives every bin on every identity change of it. Memoising the aggregation
  on `(graph.data, selectedRange, deviceState)` would delete most of the runs outright and would be a
  better first move than scheduling them more politely. This change is what remains necessary for the
  first run and for the run after each refetch — it is not a substitute for that memo, and a reviewer who
  wants the memo first is right.
- **Cancellation has to land with the chunking, not after it.** Today a stale result can already win the
  race, because `e73342b980` removed the cleanup along with the worker. Spreading the aggregation over
  several tasks widens that window, so the `isOutdated` flag is part of this change rather than a
  follow-up. An `AbortSignal` threaded into `prepareGraphDataAsync` would be tidier and would also stop
  the loop early instead of just discarding the result; it was left out to keep the diff to the two files.
- **Batch size 500 is a convention, not a measurement.** The per-point work here is heavy compared with
  the queue-draining loops elsewhere in this sweep, so a smaller batch is defensible; 500 is chosen so
  every document in the set uses one number and the reviewer argues about it once.
- **`aggregateBalanceHistory` stays exported and synchronous on purpose.** `TransactionSummary.tsx:51`
  calls it from a render body
  ([link](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L51)),
  and that call site's fix is a different lever (`useDeferredValue` on the range) with its own document.
  Changing the signature here would drag that change in.
- **`getGraphDataForInterval` is deliberately not chunked.** It is another O(points) pass and allocates a
  `Date` per point through `isWithinInterval` when a range is selected
  ([`utils.ts:382-391`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L382-L391)),
  but its per-point work is far cheaper than the `BigNumber` aggregation. The leading `await
yieldToMain()` at least keeps it off the effect's own task. Chunking it too is a follow-up if it still
  shows up.
- **No test guards this refactor.**
  [`packages/suite/src/utils/wallet/graph/utils.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.test.ts)
  covers only `mergeAccountBalanceHistory` — `aggregateBalanceHistory` has no unit test at all. A test
  over `addPointsToBins` asserting the sync and batched drivers produce identical output for the same
  input is cheap and should be part of the PR. The e2e side is unaffected: the only assertions on
  `@dashboard/graph` are visibility checks on the wrapper
  ([`suite/e2e/support/bridge.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/bridge.ts#L32),
  [`dashboardPage.ts:75`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/pageObjects/dashboardPage.ts#L75)),
  which renders regardless of processing state.
- **Why not restore the real worker.** It is the better long-term shape — the aggregation is pure and
  takes plain JSON — but it is not the cheap fix it looks like. The version that was removed spawned a
  fresh `Worker` per effect run and structured-cloned the whole filtered history across the boundary each
  time, on an effect that fires on every `graph` change. Doing it properly needs a long-lived worker and
  a request-id protocol, plus a bundling step of the kind `packages/suite-build` hand-rolls for the
  transport shared worker
  ([`vite.config.mts:182`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/vite.config.mts#L182)).
  Worth doing only if the aggregation is still hot after chunking.
- **Renaming `utilsWorker.ts` is not in this change.** It would churn the barrel at
  [`index.ts:13`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/index.ts#L13)
  and the `TransactionSummary` import for no behavioural gain. Deleting the "poor man's web worker"
  comment is in scope, because that comment states something untrue about the code directly beneath it.
  The `TODO reorganize, because worker is no more` at `index.ts:2` stays until someone does the rename.
- **Platform.** Web and desktop; `packages/suite` is private, but `yieldToMain` lands in the published
  `@trezor/utils`, so that half is a published-API addition. `packages/suite` already references
  `../utils` in its `tsconfig.json`. `suite-desktop` is Chromium and always gets the real
  `scheduler.yield()`. On a browser without it, every yield falls back to `setTimeout(resolve, 0)` and
  the clamp arithmetic above applies in full — the app still becomes responsive, but the run takes longer
  than it does on desktop. That asymmetry is worth stating in the PR description rather than discovering
  in review.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
