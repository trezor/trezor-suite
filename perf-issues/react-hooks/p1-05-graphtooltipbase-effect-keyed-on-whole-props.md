Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required
dependencies"_. Found by sweep, not named in the doc. Distinct from the already-filed
[#31137](https://github.com/trezor/trezor-suite/issues/31137), which covers this same directory's
`TransactionsGraph.tsx` `setWidth`/`GraphYAxisTick` layout-effect refire — this is a separate defect,
in `GraphTooltipBase`'s own effect.

## Where

[`packages/suite/src/components/suite/graph/TransactionsGraph/GraphTooltipBase.tsx:132`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/GraphTooltipBase.tsx#L132)

- Setter it drives: [`TransactionsGraph.tsx:96`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L96)
  — `onShow: (index: number) => setHovered(index)`, part of `tooltipContentProps`
  ([`:92-97`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L92-L97))
  spread into `GraphTooltipAccount`/`GraphTooltipDashboard`
  ([`:170-183`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L170-L183)).

## Before

```tsx
export const GraphTooltipBase = (props: GraphTooltipBaseProps) => {
    useEffect(() => {
        if (!props.onShow || !props.extendedDataForInterval) {
            return;
        }

        props.onShow(
            props.extendedDataForInterval.findIndex(
                item => item.time === props.payload?.[0]?.payload.time,
            ),
        );
    }, [props]);
```

## After

```tsx
export const GraphTooltipBase = (props: GraphTooltipBaseProps) => {
    const activeTime = props.payload?.[0]?.payload.time;

    useEffect(() => {
        if (!props.onShow || !props.extendedDataForInterval) {
            return;
        }

        props.onShow(props.extendedDataForInterval.findIndex(item => item.time === activeTime));
    }, [props.onShow, props.extendedDataForInterval, activeTime]);
```

## Why it matters

`GraphTooltipBase` positions itself off `props.coordinate`/`props.viewBox` (lines 159-160), fields
recharts updates continuously while the pointer moves over the chart, independently of whether the
active data point has actually changed. Because the effect's dependency is the whole `props` object,
it re-runs on every one of those ticks, not just when the active point changes: each run does an
O(n) `findIndex` scan over the full `extendedDataForInterval` and calls `props.onShow` (`setHovered`
in the parent `TransactionsGraph`). `setHovered`'s primitive argument means React bails out of an
actual re-render when the index repeats, but the scan and the call itself still run on every pointer
tick, on every hover of the account or dashboard balance graph.

## Notes

- No new imports; `activeTime` is a plain `const` derived from a prop already read inside the
  effect (`props.payload?.[0]?.payload.time`, the same expression currently inlined in the
  `findIndex` callback).
- `props.onShow` is itself a fresh inline arrow defined at `TransactionsGraph.tsx:96` (not
  `useCallback`-wrapped), so the residual re-run cadence after this fix is bounded by
  `TransactionsGraph`'s own render rate rather than eliminated outright — still a large reduction
  from "every pointer tick" to "every time the parent re-renders." Stabilizing that arrow is outside
  this finding's anchor.
- Sibling draft p1-06 (not yet filed) covers a related but distinct defect one component up:
  `TransactionsGraph`'s own `extendedDataForInterval` is recomputed unmemoized on every render,
  including the ones this effect's `setHovered` call triggers. The two compound but are independent
  fixes; this doc's fix stands on its own regardless of whether that one lands.
- `packages/suite` is web/desktop, not React-Compiler-covered — this dependency-narrowing fix is
  manual and has no compiler alternative.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
