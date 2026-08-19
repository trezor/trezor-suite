Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/components/src/components/Table/Table.tsx:68`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Table/Table.tsx#L68)

- Consumers: [`TableRow.tsx:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Table/TableRow.tsx#L94)
  and [`TableCell.tsx:72`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Table/TableCell.tsx#L72)
  — both call `useTable()` (`useContext(TableContext)`).
- Trigger source: [`packages/components/src/utils/useScrollShadow.tsx:73-83`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/utils/useScrollShadow.tsx#L73-L83)
  — the four `setIsScrolledTo*` calls fired from `onScroll`, which re-render `Table` on every
  scroll-shadow boundary crossing.

## Before

```tsx
// Table.tsx:53-68
export const Table = ({
    children,
    margin,
    colWidths,
    isRowHighlightedOnHover = false,
    hasBorders = true,
    typographyStyle = 'body-md',
    backgroundColor = 'surfaceFillRaised',
}: TableProps) => {
    const { scrollElementRef, onScroll, ShadowContainer, ShadowRight, ShadowLeft } =
        useScrollShadow({
            backgroundColor,
        });

    return (
        <TableContext.Provider value={{ isRowHighlightedOnHover, hasBorders, typographyStyle }}>
```

Both row-level consumers read the context directly:

```tsx
// TableRow.tsx:94
const { isRowHighlightedOnHover, hasBorders } = useTable();

// TableCell.tsx:72
const { hasBorders, typographyStyle = 'body-md' } = useTable();
```

`isRowHighlightedOnHover`, `hasBorders`, and `typographyStyle` only ever change when `Table`'s own
props change, but the object literal wrapping them is fresh on every render of `Table` — including
renders `Table` triggers on itself. `useScrollShadow` (`useScrollShadow.tsx:73-83`) calls
`setIsScrolledToTop`/`setIsScrolledToBottom`/`setIsScrolledToLeft`/`setIsScrolledToRight` from the
`onScroll` handler; `Object.is` bails those state updates out to boundary crossings only, but each
crossing still re-renders `Table` and mints a new Provider value.

## After

```tsx
const tableContextValue = useMemo(
    () => ({ isRowHighlightedOnHover, hasBorders, typographyStyle }),
    [isRowHighlightedOnHover, hasBorders, typographyStyle],
);

return (
    <TableContext.Provider value={tableContextValue}>
```

## Why it matters

React re-renders every consumer of a context whenever the Provider's `value` reference changes,
independent of `memo()` on the consumer — context propagation bypasses that bail-out entirely. Any
`Table` instance with many rows (a transaction table, an asset table, a settings table) currently
re-renders every `TableRow` and `TableCell` — and their `Text`/formatting children — the moment the
user scrolls it to an edge, even though no row's underlying data changed and the trigger is a
completely ordinary user action. The cost scales with row count and repeats on every
top/bottom/left/right boundary crossing for the table's lifetime.

## Notes

- Compile requirement: add `useMemo` to the existing `import { type ReactNode } from 'react';` on
  `Table.tsx:1`.
- All three memo inputs are `Table`'s own destructured props/defaults (all primitives), so this memo
  is cheap and will always hit across the boundary-crossing re-renders described above — a pure win
  with no correctness trade-off.
- `TableRow`/`TableCell` are not wrapped in `memo()` (confirmed while reading both files), but that
  doesn't change what needs fixing: a `memo()`-wrapped component that reads a changed context via
  `useContext` still re-renders, so wrapping the rows/cells would not by itself have prevented this
  — the fix has to be at the Provider.
- `useScrollShadow.tsx` itself is written correctly — the four scroll-position booleans are
  legitimate derived state, bailed out via `Object.is` on every non-boundary scroll tick. It's cited
  here only as the trigger source, not as something to change.
- Correct in-repo sibling for this exact shape:
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetOptionsContext.tsx:26-29`
  already wraps its Provider value in `useMemo` keyed on its constituent props.
- `packages/components` ships to both the uncompiled `packages/suite` web/desktop app and the
  React-Compiler-covered `suite-native`; per this area's scope, native-vs-web doesn't change the fix
  — memoize for the web consumer.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
