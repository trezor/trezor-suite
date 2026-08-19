# Switching the account graph range re-aggregates the account's whole balance history in `TransactionSummary`'s render body

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, its closing rule: for work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`. Clicking day/week/month/year/all on the account graph is a direct manipulation of a control, and the control cannot repaint until the aggregation it triggered has finished, because both happen in the same commit. The sibling dashboard graph already pushes the identical computation off the commit; the account graph does it inline.

## Where

[`packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L41) is the component under the account graph on the Transactions page ([`Transactions.tsx:86`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/Transactions.tsx#L86)). Everything it derives is computed in the render body, with **no `useMemo` anywhere on the path**:

- [`TransactionSummary.tsx:48`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L48) — `getGraphDataForInterval` ([`utils.ts:367`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L367)) re-filters every history point through `isWithinInterval` ([`utils.ts:386`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L386));
- [`TransactionSummary.tsx:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L50) — `aggregateBalanceHistory` ([`utilsWorker.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L32)) walks the survivors and, per point, builds three `FiatValueMap`s ([`utilsWorker.ts:48`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L48)–`:50`) via `calcFiatValueMap` ([`utilsWorker.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L18));
- [`TransactionSummary.tsx:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L58) — `getMinMaxValueFromData` ([`utils.ts:130`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L130)) walks the aggregated points again, allocating three `BigNumber`s per point ([`utils.ts:149`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L149));
- [`TransactionSummary.tsx:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L66) and [`:74`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L74) — `xTicks` and `dataInterval`, both derived from the same array;
- then `SummaryCards` ([`TransactionSummary.tsx:151`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L151)) runs four more full passes over `data` in the same commit ([`SummaryCards.tsx:77`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/SummaryCards.tsx#L77), [`:88`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/SummaryCards.tsx#L88), [`:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/SummaryCards.tsx#L94), [`:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/SummaryCards.tsx#L98)), and recharts renders one `<Cell>` per point per bar series ([`TransactionsGraph.tsx:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L51)).

The trigger is the range control sitting directly under the graph. `SelectBar`'s `onChange` dispatches to redux at [`GraphRangeSelector.tsx:176`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L176):

```tsx
setSelectedRange(range);
```

which lands in [`graphReducer.ts:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/graphReducer.ts#L131). `TransactionSummary` subscribes to that slice at [`:42`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L42)–[`:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L43) (twice — once for `selectedRange`, once for the whole slice) and recomputes from scratch. The `SelectBar` thumb, the spinner next to it ([`GraphRangeSelector.tsx:182`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L182)) and the chart all land in that one commit, so none of them can appear until the aggregation is done.

## Before

```tsx
export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const graph = useSelector(state => state.wallet.graph);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const isGraphDataLoaded = intervalGraphData.length > 0;
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    const error = intervalGraphData[0]?.error ?? false;
    const isLoading = intervalGraphData[0]?.isLoading ?? false;

    // aggregate values from shown graph data
    const minMaxValues = getMinMaxValueFromData(
        data,
        'account',
        d => new BigNumber(d.sent),
        d => new BigNumber(d.received),
        d => new BigNumber(d.balance),
    );

    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data).map(getUnixTime)
            : calcTicks(selectedRange.startDate, selectedRange.endDate).map(getUnixTime);

    // Interval shown in InfoCard below the graph
    // For 'all' range pick first and last datapoint's timestamps
    // For other intervals do same date calculation as in calcTicks func
    const dataInterval: [number | undefined, number | undefined] =
        selectedRange.label === 'all'
            ? [
                  intervalGraphData[0]?.data[0]?.time,
                  intervalGraphData[0]?.data[(intervalGraphData[0]?.data.length ?? 1) - 1]?.time,
              ]
            : [getUnixTime(selectedRange.startDate), getUnixTime(selectedRange.endDate)];
```

## After

A new first import line, followed by the existing blank line before `date-fns`:

```tsx
import { useDeferredValue, useMemo } from 'react';
```

Then, replacing [`TransactionSummary.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L41)–[`:80`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L80):

```tsx
export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const graph = useSelector(state => state.wallet.graph);

    // Aggregating the balance history walks every point the account has, so the graph follows the
    // range at transition priority and the selector itself commits on the click.
    const deferredGraph = useDeferredValue(graph);
    const isRangePending = deferredGraph !== graph;
    const { selectedRange } = deferredGraph;

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const { data, dataInterval, error, isGraphDataLoaded, isLoading, minMaxValues, xTicks } =
        useMemo(() => {
            const intervalGraphData = getGraphDataForInterval({ account, graph: deferredGraph });
            const data = intervalGraphData[0]?.data
                ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
                : [];

            // aggregate values from shown graph data
            const minMaxValues = getMinMaxValueFromData(
                data,
                'account',
                d => new BigNumber(d.sent),
                d => new BigNumber(d.received),
                d => new BigNumber(d.balance),
            );

            const xTicks =
                selectedRange.label === 'all'
                    ? calcTicksFromData(data).map(getUnixTime)
                    : calcTicks(selectedRange.startDate, selectedRange.endDate).map(getUnixTime);

            // Interval shown in InfoCard below the graph
            // For 'all' range pick first and last datapoint's timestamps
            // For other intervals do same date calculation as in calcTicks func
            const dataInterval: [number | undefined, number | undefined] =
                selectedRange.label === 'all'
                    ? [
                          intervalGraphData[0]?.data[0]?.time,
                          intervalGraphData[0]?.data[(intervalGraphData[0]?.data.length ?? 1) - 1]
                              ?.time,
                      ]
                    : [getUnixTime(selectedRange.startDate), getUnixTime(selectedRange.endDate)];

            return {
                data,
                dataInterval,
                error: intervalGraphData[0]?.error ?? false,
                isGraphDataLoaded: intervalGraphData.length > 0,
                isLoading: intervalGraphData[0]?.isLoading ?? false,
                minMaxValues,
                xTicks,
            };
        }, [account, deferredGraph, selectedRange]);
```

and both `GraphRangeSelector` call sites ([`:114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L114) and [`:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L143)) show the spinner while the graph is behind:

```tsx
<GraphRangeSelector onSelectedRange={onSelectedRange} isLoading={isLoading || isRangePending} />
```

Nothing else in the JSX changes. `TransactionsGraph` and `SummaryCards` keep receiving the plain `isLoading`, so during the catch-up they keep showing the previous range's chart and totals rather than flashing a skeleton — `isSkeletonShown` is `isLoading && !data?.length` ([`TransactionsGraph.tsx:102`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L102)), and they are consistent with each other because both now read the deferred range.

## Why it matters

The user is on an account's Transactions page and clicks a different range on the graph. Today that click cannot produce a single pixel of feedback — not the thumb moving, not the spinner — until the whole recomputation and the recharts re-render have finished, because they are one synchronous commit.

`n` is the account's balance-history points. The history is fetched with `groupBy: DAY_IN_SECONDS` ([`graphActions.ts:120`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/graphActions.ts#L120)), so it is one point per day on which the account had activity, from its first transaction to today, accumulated across sessions by `mergeAccountBalanceHistory`. It grows with account age and use and nothing in the app caps it. The per-point cost is not a constant either: each point produces three `FiatValueMap`s, and each map is built over **every** fiat symbol in that point's `rates` object — the request passes no currency filter ([`graphActions.ts:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/graphActions.ts#L115)–`:120`), so that is whatever set the backend returns — with a `BigNumber` constructed per entry inside `toFiatCurrency`. Points that land in an existing bin walk those three maps a second time through `sumFiatValueMapInPlace` ([`utilsWorker.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L92)). So the real multiplier is points × 3 × fiat symbols, and then `getMinMaxValueFromData` and four reduces in `SummaryCards` walk the result again.

The default range is `all` ([`settings.ts:19`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/config/suite/settings.ts#L19)), so the page opens on the widest one and the first commit is the most expensive one.

After the change the click is acknowledged before any of that starts: `GraphRangeSelector` reads `selectedRange` from redux itself ([`GraphRangeSelector.tsx:88`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L88)), so the thumb moves and the spinner appears in the urgent commit, while `TransactionSummary`'s memo returns the previous range's cached result untouched. The aggregation then runs in a transition render and the chart and cards swap in when it lands. A second click on another range before the first has finished discards the pending transition instead of queueing a second one.

**Honest sizing.** This does not make the aggregation cheaper, and it does not make it interruptible either — `aggregateBalanceHistory` is one synchronous call inside one component's render, and React can yield between components but not inside a function body. If the aggregation alone is a long task, it is still a long task; what changes is that the user gets feedback before it begins and that a superseded pass is thrown away. And `n` is smaller than "one point per day since the first transaction" suggests: the backend returns buckets only for days with activity, so a personal account used a few times a month has hundreds of points, not thousands, and for that account this may be a change nobody can perceive. The accounts where it bites are the long-lived, heavily used ones — which are also the ones where the page is worst today.

## Notes

- **The `After` hunk has not been compiled.** It is written against the surrounding types by reading, and the `useMemo` return shape in particular deserves a compile before review.
- **The `useMemo` is doing most of the work here, and a reviewer may reasonably take only that half.** Without the memo, `useDeferredValue` makes things _worse_: the urgent pass would aggregate with the old range and the transition pass would aggregate again with the new one, so a click would cost two full passes instead of one. With the memo, the urgent pass is free. Note also that the memo alone — no deferral — already fixes a second, separate problem: today `TransactionSummary` recomputes on _every_ render for any reason, not just on a range change. If review wants the smallest possible change, `useMemo` first and `useDeferredValue` in a follow-up is a defensible split.
- **Why `useDeferredValue` and not `startTransition`.** The range round-trips through redux (`setSelectedRange` at [`useGraph.ts:16`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useGraph.ts#L16)), and react-redux 9.3.0 ([`packages/suite/package.json:188`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L188)) subscribes through `useSyncExternalStore`; React cannot defer an external-store update without risking tearing, so wrapping the dispatch in `startTransition` would defer nothing. Independently of that, the selector's own value has to update immediately or the control feels broken, which is exactly the case `useDeferredValue` on the value passed downward is for. React is 19.2.3 ([`packages/suite/package.json:181`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L181)); `packages/suite` is **not** compiled with React Compiler (the only `reactCompiler` flag in the repo is `suite-native/app/app.config.ts:326`), so the explicit `useMemo` is required and not redundant.
- **The whole slice is deferred, not just the range — deliberately.** `getGraphDataForInterval` takes a `GraphState` and reads `graph.selectedRange` out of it ([`utils.ts:372`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L372)), so deferring only `selectedRange` while keeping `graph` in the deps would leave the memo keyed on an object that changes in the _same_ redux update — the memo would miss on exactly the render it is there to make cheap. Deferring `deferredGraph` keeps range and data consistent. The cost is that `error` and `isLoading` now come from the deferred slice too and therefore land one transition late; the spinner case is covered by `isRangePending`, the error card is not — it would appear one transition after a fetch failure. Say so out loud in review; if that is unacceptable, the alternative is changing `getGraphDataForInterval`'s signature to take `data` and `selectedRange` separately, which touches its other call site in `prepareGraphDataAsync` and `utils.test.ts`.
- **The fetch stays urgent.** `onSelectedRange` ([`TransactionSummary.tsx:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx#L89)) dispatches `updateGraphData` from the click handler ([`GraphRangeSelector.tsx:179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L179)) and is not touched, so the network request still starts on the click and is not delayed by the deferral.
- **What the user could notice.** For one transition after the click, the chart and the summary cards still show the previous range while the thumb already shows the new one, with the spinner running next to it. Nothing can get stuck waiting: `useDeferredValue` always schedules the follow-up render, there is no timeout and no fallback path involved, and the deferred value converges as soon as the transition commits. The `HiddenPlaceholder` discreet-mode wrapper and the loading skeletons are untouched.
- **Two subscriptions collapse into one.** Line `:42` selected `selectedRange` and line `:43` selected the whole slice that contains it; the `After` drops the first. This repo's `useSelector` defaults to `shallowEqual` ([`packages/suite/src/hooks/suite/useSelector.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useSelector.ts#L15)), and the graph slice is produced by immer, so a range change yields a new slice object with the same `data` reference — the subscription still fires, as it must.
- **Tests.** There is no unit test for `TransactionSummary` and no e2e test that drives `@graph/range-selector` (the testid appears only in [`GraphRangeSelector.tsx:145`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/GraphRangeSelector.tsx#L145)). `packages/suite/src/utils/wallet/graph/utils.test.ts` covers the utils and is unaffected, since none of them change. That also means this change has no test net under it — an added test that a range click updates the chart would have to tolerate the one-transition lag, which is a good reason to write it with a web-first (retrying) assertion.
- **Extracting a hook is an option I did not take.** Moving the whole memo into `./hooks/useAccountGraphSummary.ts` next to the component would match the repo's component/hook split and shrink the component body considerably. It is a bigger diff and a naming decision, so it is left for review to ask for.
- **Platform and packaging.** Web and desktop only — this screen does not exist in `suite-native`. `packages/suite` is private, nothing published changes, and this document adds no dependency: it needs neither `yieldToMain` nor `runWhenIdle`.
- **Same lever elsewhere in this sweep.** `p1-12` (token table search), `p1-13` (accounts sidebar search) and `p2-05` (coin-control UTXO search) are the same `useDeferredValue` change on other trees; a reviewer may want one PR that establishes the pattern.
- **The other half of this pipeline is `p2-07`.** `prepareGraphDataAsync` ([`utilsWorker.ts:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utilsWorker.ts#L138)) runs the _same_ `aggregateBalanceHistory` for the dashboard, over every account of the device, from an effect ([`DashboardGraph.tsx:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx#L94)–[`:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx#L98)) behind a `setTimeout(…, 0)`. That the dashboard bothered to move this off the commit at all is the strongest evidence that the account page should not be doing it inline. `p2-07` argues for chunking `aggregateBalanceHistory` itself with `yieldToMain`; if that lands, this document's transition render inherits the chunking and stops being a long task rather than merely a deferred one. The two changes stack and neither depends on the other. This document does not re-report `p2-07`'s findings.
- **Orthogonal to the complexity sweep.** Cutting the per-point cost — the three `FiatValueMap`s built over all fiat symbols when only `baseCurrencyCode` is ever read, the repeated walks in `getMinMaxValueFromData` and `SummaryCards` — is a different fix that would shrink this work rather than reschedule it. Not covered here.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
