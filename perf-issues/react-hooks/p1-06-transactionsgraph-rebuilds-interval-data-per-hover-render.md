Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.
Distinct from the already-filed [#31137](https://github.com/trezor/trezor-suite/issues/31137), which
covers this same file's `setWidth`/`GraphYAxisTick` layout-effect refire — this is a separate defect,
the unmemoized `extendedDataForInterval` computation.

## Where

[`packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx:85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx#L85)

- Recomputed function: [`packages/suite/src/utils/wallet/graph/utils.ts:263`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/graph/utils.ts#L263)
  — `calcFakeGraphDataForTimestamps`: three separate `timestamps.forEach` passes, one containing a
  nested `data.some(...)`/`data.findIndex(...)` per tick, plus a final `.sort()`.

## Before

```tsx
const [maxYTickWidth, setMaxYTickWidth] = useState(20);
const [hovered, setHovered] = useState(-1);
...
// calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
const extendedDataForInterval =
    variant === 'one-asset'
        ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
        : calcFakeGraphDataForTimestamps(xTicks, data);
```

## After

```tsx
const [maxYTickWidth, setMaxYTickWidth] = useState(20);
const [hovered, setHovered] = useState(-1);
...
// calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
const extendedDataForInterval = useMemo(
    () =>
        variant === 'one-asset'
            ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
            : calcFakeGraphDataForTimestamps(xTicks, data),
    [variant, xTicks, data, account?.formattedBalance],
);
```

## Why it matters

`TransactionsGraph` is `memo()`-wrapped, but that only guards against unchanged-prop re-renders from
its parent — it does nothing for the component's own `hovered`/`maxYTickWidth` state, which the
hover interaction (see sibling draft p1-05, not yet filed — `GraphTooltipBase`'s effect calling
`setHovered` on every pointer tick) and the Y-axis width measurement update on every relevant tick.
Every one of those re-renders currently recomputes `extendedDataForInterval` from scratch — three
linear passes over `xTicks` plus a nested scan of `data` per tick plus a final sort — even though
none of `variant`, `xTicks`, `data`, or the account's formatted balance changed. `xTicks` scales with
the selected range (a year of daily ticks for the "all" range), so the recompute is not free.

## Notes

- Compile requirement: add `useMemo` to the existing `import { memo, useState } from 'react';` on
  line 1.
- The dependency array uses `account?.formattedBalance`, not the unguarded `account.formattedBalance`:
  outside the `variant === 'one-asset'` branch, `account` types as `Account | undefined`
  (`TransactionsGraphProps` is a `CryptoGraphProps | FiatGraphProps` union where only the crypto
  variant carries a required `account`) — exactly why the existing
  `calcYDomain(minMaxValues, account?.formattedBalance)` one line above already optional-chains it.
- Sibling draft p1-05 (not yet filed) is the specific hover-cadence source; the two are independent
  fixes that compound in the same component, and this fix stands on its own regardless of whether
  that one lands.
- Out of scope for this finding: the internal cost of `calcFakeGraphDataForTimestamps` itself is
  asymptotic-complexity's lane. The related upstream dashboard-aggregation cost sits in the
  scheduling sweep's own local drafts (not yet filed):
  `perf-issues/scheduling/p2-06-transactionsummary-aggregates-in-the-render-body.md` and
  `perf-issues/scheduling/p2-07-preparegraphdataasync-is-a-settimeout-zero-poor-mans-worker.md`. In
  scope here is only that this call reruns exclusively when its real inputs change.
- `packages/suite` is web/desktop, not React-Compiler-covered — `useMemo` is the only mechanism
  available at runtime.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
