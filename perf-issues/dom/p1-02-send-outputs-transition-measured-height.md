Send-form outputs animate a ResizeObserver-measured `height` on every inner size change

Extracted from the `skills/performance-dom/SKILL.md` audit — section _"Transition compositor
properties, and never leave the property unnamed"_. Found by sweep, not named in the doc. Same
defect class as [#31128](https://github.com/trezor/trezor-suite/issues/31128) (ProgressBar
`width`), but on the send form and triggered by ordinary typing, not just by an explicit
open/close action.

## Where

[`packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:20-23`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Outputs/Outputs.tsx#L20-L23)
(the transition) fed by
[`:44-56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Outputs/Outputs.tsx#L44-L56)
(the measurement).

## Before

```tsx
const Container = styled.div<{ $height: number }>`
    height: ${({ $height }) => ($height ? `${$height}px` : 'auto')};
    transition: height 0.2s ${motionEasingStrings.transition};
`;
```

```tsx
useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
        if (entry) {
            setHeight(entry.contentRect.height);
        }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
}, []);
```

## After

Smallest conforming diff — stop animating the layout property; keep the observer only if
something else needs the number (nothing else does today, so both can go):

```tsx
const Container = styled.div`
    height: auto;
`;
```

If the smooth-resize UX must stay, the in-repo good pattern for content of known size is
[`ExpandableAssetRowTokens.tsx:14-22`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx#L14-L22)
— set the target height in one step (single layout) and animate only `opacity`, with
`will-change` pinning the layer. A middle ground is scoping the transition to output add/remove
(the one case where the slide reads as intentional) rather than every intrinsic size change.

## Why it matters

The observer read itself is free — `contentRect` arrives post-layout, which is exactly what the
skill recommends. The defect is what the number feeds: a CSS `transition: height` on the
outputs' wrapper. Every change of the form's intrinsic size — a validation message appearing or
disappearing under Amount **while the user types**, the token select opening, an output being
added or removed, the fiat row toggling — resizes the inner `div`, the observer pushes a new px
height, and the browser then animates a layout property for 0.2 s: style + layout of the send
form and everything below it on each of ~12 frames. Because the inner content has *already*
snapped to its final size (only the outer `Container` lags behind, and it has no
`overflow: hidden`), the animation buys a soft slide of the content *below* the form at the cost
of per-frame relayout — and rapid successive changes (typing through validation states) restart
it over and over.

## Notes

- `disableAnim` (`:26`) exists because even tests trip over this animation.
- The `height: 0` initial state means the form *always* animates 0 → full height on mount too —
  first paint of the send page pays ~12 layout frames before settling.
- Honest sizing: the subtree is the send form column, not the whole shell; the trigger cadence
  (every intrinsic size change, including keystroke-driven validation toggles) is what lifts it
  to P1. Not profiled; a trace while typing an invalid-then-valid amount would quantify it.
- Overlap check: `TokenSelect`/`Amount` hook-family findings live in
  `../react-hooks/p2-11` and `../react-hooks/p2-15`; they fix re-render causes — this fixes the
  layout animation those re-renders feed. No conflict.

<sub>Verified against `issues/perf-performance-dom` at `1eacf16b1d`. Part of #28886, belongs under #30497.</sub>
