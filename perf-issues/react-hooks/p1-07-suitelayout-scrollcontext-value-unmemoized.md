Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx:113`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx#L113)

- Consumer: [`suite/router/src/useAnchor.ts:8`](https://github.com/trezor/trezor-suite/blob/develop/suite/router/src/useAnchor.ts#L8)
  — `useContext(ScrollContext)`.
- Consumer's caller: [`packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:62`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx#L62)
  — `memo()`-wrapped, one instance per row of every visible transaction list.

## Before

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);
const { scrollRef } = useResetScrollOnUrl();
const topOffset = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + ANCHOR_SCROLL_OFFSET;

useClearAnchorHighlightOnClick(wrapperRef);

return (
    <ScrollContext.Provider value={{ scrollRef, topOffset }}>
        <Wrapper ref={wrapperRef} data-testid="@suite-layout">
```

## After

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);
const { scrollRef } = useResetScrollOnUrl();
const topOffset = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + ANCHOR_SCROLL_OFFSET;

useClearAnchorHighlightOnClick(wrapperRef);

const scrollContextValue = useMemo(() => ({ scrollRef, topOffset }), [scrollRef, topOffset]);

return (
    <ScrollContext.Provider value={scrollContextValue}>
        <Wrapper ref={wrapperRef} data-testid="@suite-layout">
```

## Why it matters

React re-renders every consumer of a context whenever the Provider hands it a new `value` reference,
regardless of `memo()` on the consumer — `memo()` only blocks re-renders coming from unchanged
props, not from a subscribed context. `SuiteLayout` creates a fresh `{ scrollRef, topOffset }` object
on every one of its own re-renders (every page navigation sets `layoutHeader`/`layoutFooter`/`title`
via `LayoutContext`; every tablet/desktop breakpoint crossing flips `isBelowTablet`), even though
`scrollRef` (a `useRef` created once in `useResetScrollOnUrl`) and `topOffset` (a compile-time sum of
constants) never actually change. `useAnchor` — called by every visible `TransactionItem`, a
component the repo explicitly `memo()`-wrapped — reads this context directly, so every page
navigation currently forces every rendered transaction row to re-render for no reason.

## Notes

- Compile requirement: add `useMemo` to the existing `import { type ReactNode, useRef, useState } from 'react';`
  on line 1.
- Correct in-repo sibling for this exact shape:
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetOptionsContext.tsx:26-29`
  already computes its Provider value via `useMemo` keyed on its constituent props before handing it
  to `.Provider value={contextValue}` — the same pattern proposed here.
- Both inputs to the memo are stable for the component's whole lifetime (verified
  `useResetScrollOnUrl.ts:11`, a `useRef` created once, and the `topOffset` arithmetic, a sum of
  three module-level constants), so this memo will always hit — a pure win with no correctness
  trade-off.
- `packages/suite` is web/desktop, not React-Compiler-covered — `useMemo` is the only mechanism
  available at runtime; this is not something to fix in the native app.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
