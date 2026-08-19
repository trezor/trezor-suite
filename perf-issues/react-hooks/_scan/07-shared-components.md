# Area 07 — packages/components, product-components, react-utils, suite-desktop-ui

Scope: `packages/components/src/**`, `packages/product-components/src/**`, `packages/react-utils/src/**`
(including auditing all C8 `useFreshRef`/`useCurrentRef` call sites for class-7 misuse),
`packages/suite-desktop-ui/src/**`. All four ship to the uncompiled web/desktop app, so manual
memoization findings are valid everywhere in this area (`packages/components` also ships to native,
but native-vs-web doesn't change the fix here — memoize for the web consumer per the skill).

Design-system primitives render at high multiplicity — one unstable dependency in `Table`, `Menu`,
`Select`, `TokenIconSet` etc. multiplies through every row/instance across the whole app. Severity
below is weighted for that.

---

## F-07-1 — `Table`'s context value forces every row/cell to re-render on scroll-shadow boundary crossings, independent of row data

- **Class:** 5 (missing memoization where identity matters — inline Provider value with many consumers)
- **Where:** `packages/components/src/components/Table/Table.tsx:62-68` (Provider), consumed at
  `packages/components/src/components/Table/TableRow.tsx:94` and
  `packages/components/src/components/Table/TableCell.tsx:72`; trigger source
  `packages/components/src/utils/useScrollShadow.tsx:70-83`
- **Trigger cadence:** every render of `Table` — including `Table`'s own internal state changes
  (scroll-shadow visibility toggling at top/bottom/left/right), not just parent-driven re-renders
- **Severity guess:** P1 (hot: every `Table` instance across the app — transaction tables, asset
  tables, settings tables — and the trigger is a completely ordinary user action)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
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

`TableRow`/`TableCell` both call `useTable()` (`useContext(TableContext)`) to read
`isRowHighlightedOnHover`/`hasBorders`/`typographyStyle`. Neither is wrapped in `memo()`, but that
doesn't matter here: React re-renders every context consumer when the Provider's value changes
identity, bypassing the normal "same `children` reference" bailout entirely — so even a `Table`
whose row JSX is unchanged still re-renders every row when only the Provider value is fresh.

`useScrollShadow` (`packages/components/src/utils/useScrollShadow.tsx:70-83`) calls
`setIsScrolledToTop`/`setIsScrolledToBottom`/`setIsScrolledToLeft`/`setIsScrolledToRight` from the
`onScroll` handler; React bails out via `Object.is` so this is bounded to boundary crossings (not
every scroll pixel), but each crossing re-renders `Table` — with nothing in `children` having
changed — and mints a fresh Provider value.

### Proposed fix

```tsx
const tableContextValue = useMemo(
    () => ({ isRowHighlightedOnHover, hasBorders, typographyStyle }),
    [isRowHighlightedOnHover, hasBorders, typographyStyle],
);
```

Use `tableContextValue` as the Provider's `value`. All three inputs are already primitives, so this
memo is cheap and will actually hold across the boundary-crossing re-renders described above.

### Why it matters

Any `Table` with many rows (a transaction list, an asset table) re-renders every `TableRow` and
`TableCell` — including their `Text`/formatting children — the moment the user scrolls it to an
edge, even though no row's underlying data changed. The cost scales with row count and repeats on
every top/bottom/left/right boundary crossing for the lifetime of the table.

---

## F-07-2 — `VirtualizedList`'s scroll-end debounce is silently reset by its only real caller, churning the scroll listener

- **Class:** 1 (unstable hook dependency crossing a component boundary)
- **Where:** `packages/components/src/components/VirtualizedList/VirtualizedList.tsx:126` (memo),
  `:149-203` (`handleScroll`, depends on the memo), `:205-212` (scroll-listener effect, depends on
  `handleScroll`); triggered by
  `packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:28`
  (outside my area — cited as the demonstrated consumer)
- **Trigger cadence:** once per "near the end of the list" scroll event (`loadMoreBufferCount`
  threshold), for as long as the user keeps scrolling a long asset/coin list
- **Severity guess:** P2 (real, reproducible with the sole current caller; bounded to load-more
  moments rather than every scroll frame)
- **Confidence:** high — traced end to end through both files

### Before (verbatim from the file)

```tsx
// VirtualizedList.tsx:126
const debouncedOnScrollEnd = useMemo(() => debounce(onScrollEnd, 1000), [onScrollEnd]);
```

```tsx
// AssetsList.tsx:27-28 (the only real consumer, packages/suite — not my area, cited as evidence)
const [end, setEnd] = useState(items.length);
const onScrollEnd = useCallback(() => setEnd(end + 1000), [end]);
```

`onScrollEnd` is a `useCallback` whose own dependency is the state it sets (`end`), so its identity
changes every time it fires. `debounce()` (defined at `VirtualizedList.tsx:19-33`) closes over a
fresh, independent `timeout` variable each call, so recreating it discards whatever debounce/timer
bookkeeping the previous instance had. `handleScroll` (`:149-203`) depends on `debouncedOnScrollEnd`
at `:196`, and the scroll-listener effect (`:205-212`) depends on `handleScroll`, so the whole chain
— including a `removeEventListener`/`addEventListener` pair on the scrollable container — re-runs
every time `AssetsList` re-renders after a load-more trigger. (Separately, `AssetsList.tsx` passes
the _entire_ `items` array to `VirtualizedList` regardless of `end`, so the `end`/`setEnd` state
this defeats doesn't appear to gate anything today — but that's a correctness/dead-code question
for `packages/suite`, not this file.)

### Proposed fix

Decouple the debounce's lifetime from the caller's callback identity with the ref hook this area
owns:

```tsx
import { useFreshRef } from '@trezor/react-utils';

const onScrollEndRef = useFreshRef(onScrollEnd);
const debouncedOnScrollEnd = useMemo(
    () => debounce(() => onScrollEndRef.current(), 1000),
    [onScrollEndRef],
);
```

`useFreshRef`'s returned ref object is stable for the component's lifetime, so the `useMemo` now
only runs once, `handleScroll`'s identity stops churning, and the scroll listener is registered
once instead of on every load-more trigger — while still always calling the latest `onScrollEnd`.
Note: `packages/components/package.json` doesn't currently depend on `@trezor/react-utils` — add
it as a workspace dependency (both are same-layer `packages/*`, so this doesn't cross the layering
rule).

### Why it matters

Every scroll-near-the-end event during a long scroll session through `VirtualizedList`'s one real
consumer (the asset/coin picker, which can hold every network's tokens) tears down and rebuilds the
scroll subscription and the debounce timer, instead of the debounce staying stable for the
component's lifetime as its 1000 ms wait implies it should.

---

## F-07-3 — `TokenIconSet`'s memo is correctly written but permanently defeated by its real caller

- **Class:** 1 (unstable dependency crossing a component boundary into a `useMemo`)
- **Where:** `packages/product-components/src/components/TokenIconSet/TokenIconSet.tsx:30-55`;
  fed by `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:62-68` (outside my area —
  already flagged there as `_scan/03-wallet-earn-comp.md` F-03-2, for the _wrapper's own_
  unmemoized `flatMap`/`reduce`/`sort` chain; this is the distinct, downstream symptom in my area's
  file)
- **Trigger cadence:** every render of the dashboard's "My Assets" per-network row (fiat-rate ticks,
  sibling account updates, any unrelated re-render of the row)
- **Severity guess:** P2
- **Confidence:** high

### Before (verbatim from the file)

```tsx
// TokenIconSet.tsx:30-37
const visibleTokensContent = useMemo(() => {
    const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

    return visibleTokens.map(token => {
        /* … */
    });
}, [tokens, maxVisibleIcons, symbol, size, gap, length]);
```

```tsx
// TokenIconSetWrapper.tsx:62-68 (the sole real caller)
const sortedAggregatedTokens = aggregatedTokens.sort(sortTokensWithRates);
const size = sortedAggregatedTokens.length === 1 ? 24 : 20;

return (
    <TokenIconSet size={size} gap={6} symbol={symbol} tokens={sortedAggregatedTokens} isCentered />
);
```

`TokenIconSet`'s own `useMemo` is written correctly, but `sortedAggregatedTokens` is a brand-new
array on every render of `TokenIconSetWrapper` (no memo at the source, per F-03-2), so the `tokens`
dependency here is never referentially stable and the memo never hits.

### Proposed fix

Nothing to change in `TokenIconSet.tsx` itself — the memo is correctly shaped. The fix lives at the
call site (F-03-2's proposed fix: wrap the wrapper's `flatMap`/`getTokens`/`reduce`/`sort` chain in
one `useMemo`). Documented here because the _symptom_ — a `useMemo` that can never cache — is
visible in this area's file and is easy to miss when reading `TokenIconSet.tsx` in isolation and
concluding it's already optimal.

### Why it matters

Once F-03-2 lands, this memo starts paying off for free; until then, every token-icon row on the
dashboard's My Assets table rebuilds its full `<TokenIcon>` element list from scratch on every
unrelated re-render (e.g. a fiat-rate tick touching a sibling network), regardless of this file's
own correct `useMemo`.

---

## F-07-4 — `useNetworkSelect`'s three memos are defeated every keystroke by its real callers' inline `selectConfig`

- **Class:** 1 (unstable dependency crossing a component boundary; also class 5's destructuring
  default shape)
- **Where:** `packages/product-components/src/components/SearchAsset/hooks/useNetworkSelect.ts:14-41`;
  fed by `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx:49-64`
  and its near-duplicate
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAssetPicker/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx`
  (both outside my area); search-state evidence in
  `.../AssetSearchWithNetworkFilter/hooks/useSearchFilter.ts:9-12`
- **Trigger cadence:** every keystroke in the asset-search input (confirmed: `useSearchFilter`
  holds `search` in local `useState` inside the same component that builds `selectConfig`)
- **Severity guess:** P2 (real per-keystroke cadence in a common Send/Trading flow; tempered by the
  network list itself being small)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
// useNetworkSelect.ts:14-29
export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks
            .map(symbol => {
                /* … */
            })
            .filter(isNotNull);

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networks, includeAllOption, allLabel]);
    // … selectedOption and options useMemo both chain off allOptions
```

```tsx
// AssetSearchWithNetworkFilter.tsx:43, 49-57 (real caller, rebuilt every keystroke)
const networks = protocolSymbol ? [protocolSymbol] : enabledNetworks;
// …
const selectConfig = isBitcoinOnlyFirmware
    ? undefined
    : {
          networks,
          selectedNetwork: networkFilter,
          onChange: setNetworkFilter,
          includeAllOption: !protocolSymbol,
          allLabel: translationString('TR_ALL_NETWORKS'),
      };
```

`selectConfig` is an inline object literal rebuilt on every render of
`AssetSearchWithNetworkFilterInner`, which re-renders on every keystroke because `search` is local
`useState` in the same component (`useSearchFilter.ts:9-12`). When `protocolSymbol` is set,
`networks` itself is also a fresh `[protocolSymbol]` array every render. Either way, all three of
`useNetworkSelect`'s internal `useMemo`s (`allOptions`, `selectedOption`, `options`) recompute every
keystroke and feed a fresh `options` array into the `<Select>` underneath.

### Proposed fix

In `useNetworkSelect.ts`, hoist a module-level empty-array constant for the destructuring default
(the `config ?? {}` / `networks = []` shape from the skill's own worked example):

```tsx
const EMPTY_NETWORKS: NetworkSymbol[] = [];
const { networks = EMPTY_NETWORKS, includeAllOption, allLabel, selectedNetwork } = config ?? {};
```

That only fixes the "no config at all" path. The keystroke-cadence defeat needs the fix in the
caller (outside my area): memoize `selectConfig` (and `networks` when derived from
`protocolSymbol`) with `useMemo` keyed on its primitive inputs, so `useNetworkSelect` actually
receives a stable `config` across re-renders that don't change the network list.

### Why it matters

Two near-duplicate `AssetSearchWithNetworkFilter` components (global Send/Receive, and the Trading
asset picker) both feed `useNetworkSelect` an unmemoized config, so every character typed into
either asset search box redoes the network-options list and options-minus-selected filtering,
purely as pipeline overhead on a hot per-keystroke path — small per call, but avoidable and
compounding with every keystroke.

---

## F-07-5 — `Menu`'s keyboard-navigation effects rebuild two global `document` keydown listeners on every render

- **Class:** 1 (unstable dependency: `.filter()` result feeding two `useEffect` dependency arrays)
- **Where:** `packages/components/src/components/Menu/Menu.tsx:131` (unmemoized filter),
  `:137-160` and `:163-195` (both effects depend on it)
- **Trigger cadence:** every render of an open `Menu` (any prop or parent-state change while a
  dropdown/context menu is mounted), not just when `items` actually changes
- **Severity guess:** P2 (global-listener churn on a very widely reused primitive; bounded — no
  render loop, no missed events in practice — but real waste on every render, not just per-open)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
// Menu.tsx:128-134
export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, onClose, ...rest }, ref) => {
        const frameProps = pickAndPrepareFrameProps(rest, allowedMenuFrameProps);
        const visibleItems = items?.filter(item => !item.isHidden);
        const [focusedItemIndex, setFocusedItemIndex] = useState(
            visibleItems?.length ? visibleItems.findIndex(item => !item.isDisabled) : null,
        );

        // handle selecting an item
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => { /* … */ };

            if (focusedItemIndex !== null && visibleItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [focusedItemIndex, visibleItems, onClose]);

        // handle keyboard navigation
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => { /* … */ };

            if (focusedItemIndex !== null && visibleItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [visibleItems, focusedItemIndex]);
```

`visibleItems` is a plain `.filter()` call in the render body — a new array every render regardless
of whether any item's `isHidden` flag actually changed. Both effects list it as a dependency, so
every render of an open `Menu` tears down and re-adds two separate `document`-level `keydown`
listeners, even when nothing about the visible items changed.

### Proposed fix

```tsx
const visibleItems = useMemo(() => items?.filter(item => !item.isHidden), [items]);
```

### Why it matters

`Menu` backs essentially every dropdown/context menu in the app. While a menu is open, any
re-render of it (a parent state change, a prop update unrelated to `items`) currently causes two
global keyboard-listener teardown/rebuild cycles instead of zero; both effects would instead only
re-run when the actual visible-items set changes.

---

## F-07-6 — Compound-component `Context.Provider` values are unmemoized object literals across the design system

- **Class:** 5 (missing memoization where identity matters — inline Provider value)
- **Where:**
    - `packages/components/src/components/Collapsible/Collapsible.tsx:33-39` → consumed at
      `CollapsibleContent.tsx:30`, `CollapsibleToggle.tsx:25`
    - `packages/components/src/components/Tabs/Tabs.tsx:108` → consumed at `TabsItem.tsx:63`
    - `packages/components/src/components/List/List.tsx:84-86` → consumed at `ListItem.tsx:62`
    - `packages/components/src/components/SubTabs/SubTabs.tsx:34` → consumed at `SubTabsItem.tsx:50`
    - `packages/components/src/components/StepList/StepList.tsx:63-72`
    - `packages/components/src/components/Banner/Banner.tsx:140`
    - `packages/components/src/components/Modal/Modal.tsx:95`,
      `packages/components/src/components/Modal/ModalButton.tsx:15`,
      `packages/components/src/components/Modal/ModalProvider.tsx:38-43`
- **Trigger cadence:** every render of the outer compound component (open/close toggle for
  `Collapsible`, `ResizeObserver`-driven indicator updates for `Tabs`, any prop change for the rest)
- **Severity guess:** P3 (same mechanism as F-07-1, but typical consumer counts here are small — a
  handful of tabs/steps/list items/modal buttons — rather than table-sized row counts)
- **Confidence:** high on the mechanism; low-to-medium on real-world impact per instance since it
  depends on how many children each usage actually has

### Before (two representative examples, verbatim)

```tsx
// Tabs.tsx:93-108 — updateIndicator fires from a ResizeObserver, re-rendering Tabs and
// re-creating this value even when the tab set itself hasn't changed
useEffect(() => {
    updateIndicator();
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(containerRef.current);

    return () => observer.disconnect();
}, [updateIndicator]);

return (
    <TabsContext.Provider value={{ activeItemId, isDisabled, size, setTabRef }}>
```

```tsx
// Collapsible.tsx:32-40
return (
    <CollapsibleContext.Provider
        value={{
            contentId,
            isOpen: isOpen ?? uncontrolledIsOpen,
            toggle: setUncontrolledIsOpen,
            gap,
        }}
    >
```

### Proposed fix

Wrap each Provider's `value` in a `useMemo` keyed on its own primitive fields, e.g.:

```tsx
// Tabs.tsx
const tabsContextValue = useMemo(
    () => ({ activeItemId, isDisabled, size, setTabRef }),
    [activeItemId, isDisabled, size, setTabRef],
);
```

Same shape for the other six files (each Provider's fields are already primitives or stable
setters, so this is a pure win with no new dependency wrinkles).

### Why it matters

None of `CollapsibleContent`/`CollapsibleToggle`/`TabsItem`/`ListItem`/`SubTabsItem` are wrapped in
`memo()`, so this is currently harmless in the common case where the compound component's `children`
are reconstructed by the same render that changes the Provider's inputs. It stops being harmless the
moment the outer component re-renders on its _own_ internal state (as `Tabs` already does via its
`ResizeObserver`, and `Collapsible` does via its open/close toggle) while `children` is otherwise
unchanged — that re-renders every consumer for no visible-output reason. Grouped as one cleanup
entry rather than seven, per the skill's own caution that redundant-memo write-ups shouldn't be
over-weighted relative to real loops.

---

## F-07-7 — `usePopover`'s floating-ui `middleware` array is unmemoized, unlike the identical pattern in `TooltipFloatingUi`

- **Class:** 1 (unstable array literal feeding a hook's positioning logic) / 6 (inconsistent
  memoization of the same pattern within one package)
- **Where:** `packages/components/src/components/Popover/Popover.tsx:61-75`; contrast with the
  already-correct `packages/components/src/components/Tooltip/TooltipFloatingUi.tsx:86-95`
- **Trigger cadence:** every render of any component using `usePopover`/`Popover`
- **Severity guess:** P3 (mechanism is clear and provable, but only 2 current call sites, neither
  in a per-row hot path)
- **Confidence:** high on the mechanism (floating-ui's own docs recommend memoizing `middleware`
  for exactly this reason, and this codebase already does it correctly one file over)

### Before (verbatim from the file)

```tsx
// Popover.tsx:61-75 — no useMemo
const data = useFloating({
    placement: calculatedPlacement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
        offset(popoverOffset),
        flip({
            crossAxis: calculatedPlacement.includes('-'),
            fallbackAxisSideDirection: 'end',
            padding: 5,
        }),
        shift({ padding: 5 }),
    ],
});
```

```tsx
// TooltipFloatingUi.tsx:86-95 — the sibling hook in the same package does memoize the equivalent array
const middleware = useMemo(() => {
    const middlewareArray = [
        offset(offsetValue),
        ...(!disableFlip ? [flip()] : []),
        shiftFloatingUI(shift || { padding: 8 }),
        arrow({ element: arrowRef }),
    ];

    return middlewareArray;
}, [offsetValue, shift, disableFlip, arrowRef]);
```

### Proposed fix

```tsx
const middleware = useMemo(
    () => [
        offset(popoverOffset),
        flip({
            crossAxis: calculatedPlacement.includes('-'),
            fallbackAxisSideDirection: 'end',
            padding: 5,
        }),
        shift({ padding: 5 }),
    ],
    [popoverOffset, calculatedPlacement],
);
```

then pass `middleware` into `useFloating`.

### Why it matters

An unstable `middleware` array is exactly the case `TooltipFloatingUi.tsx` was written to avoid
(floating-ui's `useFloating` uses the array's identity to decide when to redo position/flip/shift
calculations under `autoUpdate`). Every render of a `Popover` consumer currently pays that
recalculation cost for no reason; low severity today only because there are just two call sites.

---

## Checked, clean

- `packages/react-utils/src/hooks/useFreshRef.ts`, `useCurrentRef.ts` — implementations match the
  skill's description exactly (render-time assign vs. effect-time assign); no bugs in the
  primitives themselves.
- `packages/react-utils/src/hooks/useAsyncMemo.ts:20` (C8) — `useFreshRef(getValue)` is read inside
  a `useEffect` purely to call the _latest_ `getValue` without listing an unstable callback in
  `deps`; this is not previous-value semantics, so it's a correct use of `useFreshRef`, not a
  class-7 misuse.
- `packages/react-utils/src/hooks/useFreshRef.test.ts` — hook's own unit tests, not a consumer.
- `packages/react-utils/src/hooks/useKeyPress.ts` — dead code, zero call sites anywhere in the repo
  (verified by grep). Its `[]`-effect closes over the first render's `targetKey`/handlers forever,
  which would be a real class-6 staleness bug if `targetKey` ever varied across a hook instance's
  lifetime — but nothing calls it, so not reported as a live finding.
- `packages/react-utils/src/hooks/useOnClickOutside.ts` — dead code, zero call sites anywhere in
  the repo (verified by grep).
- `packages/react-utils/src/hooks/useOnce.ts`, `usePreviousDefined.ts`, `useWindowFocus.ts`,
  `useTextareaCursorPosition.ts`, `useAsyncClickHandler.ts`, `useClickCooldown.ts`,
  `useDidUpdate.ts` (no call sites within this area), `useDebounce.ts`, `useDebouncedValue.ts`,
  `timer/useCountdownTimer.ts`, `timer/useTimer.ts` — all reviewed; deps are correctly scoped to
  primitives/stable refs/setters. `useCountdownTimer`'s `{ pastDeadlineLeadMs = 1000, isEnabled =
true } = {}` (C5) only ever produces primitives from the destructure, so the fresh `{}` per
  render never reaches a memo/effect dependency array — a case where the C5 grep shape is present
  but the class-1 mechanism it warns about doesn't apply.
- `packages/components/src/components/ResizableBox/ResizableBox.tsx:333` (C1) — mount-only
  `getBoundingClientRect()` capture; the omitted `widthState`/`heightState` reads are only
  meaningful once (at mount, to detect "uninitialized"), so `[]` introduces no staleness.
- `packages/components/src/components/form/Select/customComponents.tsx:178` (C1) — mount-only
  scroll-into-view for the selected `<Option>`. This `Select` wrapper does not expose
  `isMulti`/`closeMenuOnSelect` (grep-verified: no consumer uses multi-select), so in the only
  supported mode, a selection change always accompanies a menu close/reopen (fresh mount) — no
  realistic case where `isSelected` flips on an already-mounted, non-remounted `Option`.
- `packages/components/src/components/form/Select/Select.tsx` — `memoizedComponents` depends on
  the passthrough `components` prop and `handleOnChange` depends on `onChange`; both would be
  defeated by an unstable caller, but grep confirms zero current consumers pass a `components`
  prop, and `ReactSelect` itself isn't memoized to benefit from a stable `onChange` — latent
  fragility, not a live defect.
- `packages/components/src/components/Tooltip/TooltipFloatingUi.tsx` — `middleware` useMemo
  (`:86-95`) correctly depends on `[offsetValue, shift, disableFlip, arrowRef]`; unlike
  `Popover.tsx` (F-07-7), this one is memoized. `shift` is a passthrough prop that could defeat it
  if any caller ever passed an inline object, but grep confirms zero current callers pass `shift`
  at all.
- `packages/components/src/components/animations/LottieAnimation.tsx` — `animationData` useMemo
  depends on `colorReplacements`; its only consumer (`packages/suite/.../GuideButton.tsx`) already
  wraps the array it passes in its own `useMemo`, so no live defeat.
- `packages/components/src/components/animations/recolorLottieAnimation.tsx:32` — plain Lottie-JSON
  mutation utility, not a component or hook; the `?? []` here is not a hook dependency at all
  (grep-harvest false positive, confirmed by reading).
- `packages/components/src/utils/useScrollShadow.tsx` — the four scroll-position booleans only
  actually trigger a re-render on boundary crossings (`Object.is` bails out every other scroll
  tick); correct use of derived state, not a render loop. (This is the mechanism cited as the
  trigger for F-07-1, but the hook itself is written correctly.)
- `packages/components/src/utils/frameProps.tsx:112-128` (`pickAndPrepareFrameProps`) — unmemoized
  `reduce` over a small, fixed-size array of prop names (a handful of literals per call site); O(1)
  by the skill's own carve-out, not a class-4 candidate. Line 123 is the already-excluded
  asymptotic-complexity draft `p3-06-cleanups-connect-components-and-utils-primitives.md`.
- `packages/components/src/components/VirtualizedList/VirtualizedList.tsx:233` (and the related
  `firstItemTop`/`itemHeights` prefix-sum work) — already covered by
  `perf-issues/asymptotic-complexity/p2-11-virtualizedlistx-virtualizedlistcomponent.md`, including
  its side-note on `setIndexes` (`:183`) always allocating a fresh object per scroll event. F-07-2
  above is a distinct hooks-class defect at a different line (`:126`) in the same file.
- `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx` — its own render-body
  `flatMap`/`reduce`/`sort` chain is already covered by `_scan/03-wallet-earn-comp.md` F-03-2; only
  the downstream consequence inside my area's `TokenIconSet.tsx` is reported here (F-07-3).
- `packages/components/src/components/PinInput/PinInput.tsx`,
  `packages/product-components/src/components/EditableText/EditableText.tsx`,
  `packages/product-components/src/components/InputWithOptions/InputWithOptions.tsx`,
  `packages/product-components/src/components/PasswordStrengthIndicator/PasswordStrengthIndicator.tsx` —
  effects/callbacks all keyed on primitives or correctly-scoped local state; no unstable
  dependencies found. All are single-instance form widgets (low multiplicity) regardless.
- `packages/components/src/components/loaders/Spinner/Spinner.tsx` — `useMemo` chain
  (`colorsReplace` → `memoizedAnimations` → `lottieProps`) all keyed on theme/variant-derived
  primitives; correctly written despite being one of the highest-multiplicity components in the app.
- `packages/components/src/components/form/Input`, `Checkbox`, `Radio`, `Switch` — no hooks at all
  (pure presentational props → JSX); nothing to check.
- `packages/product-components/src/components/NetworkIconSet/NetworkIconSet.tsx` — same
  `useMemo`-over-array-prop shape as `TokenIconSet.tsx` (F-07-3), but its one real consumer
  (`packages/suite/.../PortfolioCard/EmptyWallet.tsx`) renders once, not per-row; not written up
  given the low multiplicity.
- `packages/product-components/src/components/NumberInput/NumberInput.tsx` — intricate manual
  previous-value tracking (`previousFormValueRef`, `previousDisplayValueRef`) correctly uses plain
  `useRef` with a top-of-effect read / conditional end-of-effect write, not `useFreshRef`/
  `useCurrentRef` — no class-7 misuse; deps on `formatDisplayValue`/`handleChange` etc. are
  correctly scoped `useCallback`s.
- `packages/components/src/components/Table/TableRow.tsx`, `TableCell.tsx`,
  `packages/components/src/components/Tabs/TabsItem.tsx`,
  `packages/components/src/components/List/ListItem.tsx` — none wrapped in `memo()` (confirmed
  while investigating F-07-1/F-07-6); noted because it's precisely _why_ the context-value fix
  matters (context re-renders bypass the bailout memo would otherwise not even be needed for).
- `packages/suite-desktop-ui/src/**` (all files) — `DesktopUpdater.tsx` narrows its effect/callback
  dependencies to primitives (`desktopUpdate.enabled`, `.allowPrerelease`, `.latest`) rather than
  the whole Redux slice — a good example of the skill's "minimal required dependencies" guidance.
  `Available.tsx`, `Downloading.tsx`, `JustUpdated.tsx`, `EarlyAccessEnable.tsx`,
  `EarlyAccessDisable.tsx`, `Ready.tsx`, `MainDesktop.tsx`, `TorLoadingScreen.tsx` are all
  singleton/low-multiplicity modal or shell components with correctly-scoped hooks; no
  react-hooks-class findings in this package.
- C3 (selector returns fresh reference) — not applicable anywhere in this area except
  `suite-desktop-ui`'s two `useSelector` call sites (`DesktopUpdater.tsx`, `Available.tsx`), both
  of which read a slice/sub-object directly with no `.map`/`.filter`/spread; `packages/components`,
  `product-components`, and `react-utils` have no Redux access at all.
- C9 (whole-account/device-keyed effects) — no matches in this area; none of these four packages
  hold domain models (accounts/devices) directly.
