DOM cleanups: rule-conformance fixes in `packages/suite`, `packages/components`, `suite/*`

Extracted from the `skills/performance-dom/SKILL.md` audit — both sections. Six small,
independent fixes; none is a measured regression, each is the skill's pattern applied where the
cost today is one forced pass or a short layout animation on a bounded subtree. **One issue, one
PR** — they touch disjoint files.

## 1. Range slider labels are measured once in a layout effect, then stale forever

[`packages/components/src/components/form/Range/Range.tsx:197-200`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/form/Range/Range.tsx#L197-L200)

### Before

```tsx
useLayoutEffect(() => {
    if (!lastLabelRef.current) return;
    setLabelsElWidth(lastLabelRef.current?.getBoundingClientRect().width);
}, [lastLabelRef, setLabelsElWidth]);
```

### After

```tsx
useLayoutEffect(() => {
    if (!lastLabelRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
        const width = entry?.borderBoxSize?.[0]?.inlineSize;
        if (width !== undefined) setLabelsElWidth(width);
    });
    observer.observe(lastLabelRef.current);

    return () => observer.disconnect();
}, []);
```

### Why it matters

The `getBoundingClientRect` lands inside the commit, when React's own mutations have dirtied
layout — one forced synchronous layout per mount. The measured px is then frozen into
`grid-template-columns: repeat(n, <px>)` (`:179-184`): resize the container or load a different
font and the labels keep the stale width. The observer supplies the same number post-layout for
free and keeps it fresh — [`Tabs.tsx:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Tabs/Tabs.tsx#L98)
is the in-repo template.

## 2. EditableText sequences focus with a bare rAF after a state flip

[`packages/product-components/src/components/EditableText/EditableText.tsx:219-238`](https://github.com/trezor/trezor-suite/blob/develop/packages/product-components/src/components/EditableText/EditableText.tsx#L219-L238)

### Before

```tsx
const focus = (select: boolean = true) => {
    requestAnimationFrame(() => {
        if (valueRef.current) {
            valueRef.current.focus();
            // …range/selection setup
        }
    });
};
```

called from `handleEdit` (`:262-272`) immediately after `setIsEditable(true)`.

### After

Replace the rAF with an effect keyed on `isEditable` (run the focus + selection setup when it
flips to `true`, with `select` carried in a ref or state). Commit order is then guaranteed by
React instead of hoped-for from the frame scheduler.

### Why it matters

The rAF stands in for "wait until React committed the `contenteditable` attribute" — the skill's
point is that rAF grants no such ordering. If the callback beats the commit, `focus()` targets a
still-non-editable `div` and silently no-ops (such a `div` isn't focusable), so the caret never
appears — an intermittent UX bug, not just a rule violation. Perf cost is one-off per edit
action; this is conformance + determinism. Same family as #31138 (this file's `utils.ts`), which
covers the *other* two rAFs here.

## 3. useResponsiveContextOnChange pre-reads the width its observer's initial callback already delivers

[`packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:37-39`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx#L37-L39)

### Before

```tsx
const rect = ref.current.getBoundingClientRect();
lastWidthRef.current = rect.width;
setContentWidth(rect.width);

resizeObserver.observe(ref.current);
```

### After

```tsx
resizeObserver.observe(ref.current);
```

with the callback bypassing the debounce on first delivery:

```tsx
const isFirst = lastWidthRef.current === null;
// …threshold check unchanged…
lastWidthRef.current = newWidth;
if (isFirst) {
    setContentWidth(newWidth);
} else {
    debounce(() => setContentWidth(newWidth));
}
```

### Why it matters

`observe()` fires an initial post-layout callback with the same geometry for free — the exact
mechanism #31138 documents for EditableText. The manual read only exists to skip the debounce on
mount; moving that decision into the callback deletes the read and leaves one source of truth
for the width. Cost today ≈ one cheap post-paint read per `SuiteLayout` mount, so this is
conformance, not a win.

## 4. useNetworkFilter resets the list scroll through a rAF instead of the sibling keyed-effect hook

[`packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useNetworkFilter.ts:64-66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useNetworkFilter.ts#L64-L66)

### Before

```tsx
requestAnimationFrame(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
});
```

### After

Drop the rAF here and let the list own its reset with the hook the asset picker already has —
[`useListScrollReset`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/asset-picker/hooks/useListScrollReset.ts)
keyed on the filtered list's fingerprint.

### Why it matters

The rAF is standing in for "after the `goto` dispatch re-renders the list" — rAF guarantees no
ordering relative to React's commit, so the reset can hit the old list. An effect keyed on the
list content runs after the right commit by construction. One-off per filter change; same family
as item 2.

## 5. AddressHistoryRow hover animates `margin-left`, re-laying-out the row per frame

[`suite/receive/src/AddressHistoryRow.tsx:44-47`](https://github.com/trezor/trezor-suite/blob/develop/suite/receive/src/AddressHistoryRow.tsx#L44-L47)

### Before

```css
transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out,
    margin-left 0.2s ease-in-out;
```

### After

```css
transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
```

### Why it matters

`Label:hover + &` flips the margin 0 ↔ 24 px (`:53-59`), so every hover over an address label
animates a layout property for 0.2 s — the row's flex line lays out per frame and the
`min-width: 0` label re-truncates while it happens. The margin is *making room* for the labeling
edit button (comment `:22-25`), so a pure `translateX` would overlap instead of yielding space —
the smallest conforming fix keeps the room-making but snaps it, still animating the reveal via
the already-present `opacity`/`transform`.

## 6. Coinjoin wheel's inner circle transitions `width`/`height` for a 4 px breathing effect

[`packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressContent.tsx:20-29`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressContent.tsx#L20-L29)

### Before

```css
width: ${({ $isWide }) => `calc(100% - ${$isWide ? 12 : 8}px)`};
height: ${({ $isWide }) => `calc(100% - ${$isWide ? 12 : 8}px)`};
transition:
    background 0.15s ease-out,
    width 0.15s ease-out,
    height 0.15s ease-out;
```

### After

Hoist `CenteringContainer` out of `Container` (`:198-200` — it is absolutely positioned with a
fixed 80 px box, so as a sibling it renders identically), leaving `Container` a childless solid
`border-radius: 50%` fill; then:

```css
width: calc(100% - 8px);
height: calc(100% - 8px);
transform: ${({ $isWide }) => ($isWide ? 'scale(0.958)' : 'none')};
transition:
    background 0.15s ease-out,
    transform 0.15s ease-out;
```

### Why it matters

Session-state flips animate two layout properties for 0.15 s over the wheel subtree. A solid
childless circle is the skill's explicitly-safe `scale` case (the ProgressBar caveat about
distorted radii and text does not apply once the text overlay is hoisted out). Small, contained —
included for completeness.

## Notes

- Items 2 and 4 are the same misconception as the P2 asset-picker rAF
  ([`p2-01`](p2-01-asset-picker-expand-toggle-raf.md)) at lower stakes.
- Nothing here was profiled; every trigger statement is a mechanism claim from reading.
- The `After` hunks are written against the surrounding types by reading, not compiled.

<sub>Verified against `issues/perf-performance-dom` at `1eacf16b1d`. Part of #28886, belongs under #30497.</sub>
