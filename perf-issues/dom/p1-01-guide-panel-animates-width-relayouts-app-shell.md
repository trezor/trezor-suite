Guide panel opens by animating `width`, re-laying-out the whole app shell every frame

Extracted from the `skills/performance-dom/SKILL.md` audit — section _"Transition compositor
properties, and never leave the property unnamed"_. Found by sweep, not named in the doc. The
same defect class as the already-filed [#31128](https://github.com/trezor/trezor-suite/issues/31128)
(ProgressBar `width`), but expressed through framer-motion instead of a CSS `transition`, and
with app-shell blast radius instead of one bar.

## Where

[`packages/suite/src/components/guide/GuideRouter.tsx:75-95`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/guide/GuideRouter.tsx#L75-L95)

- In sync with it, the dashboard animates a spacer the same way:
  [`packages/suite/src/views/dashboard/DashboardFooter.tsx:186-195`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/DashboardFooter.tsx#L186-L195)
  — `animate={{ width: isGuideOpen ? 0 : 68 }}`. Same family, same PR.

## Before

```tsx
const content = (
    <motion.div
        data-testid="@guide/panel"
        style={{ overflow: 'hidden' }}
        initial={{
            width: isFirstRender ? width : 0,
        }}
        animate={{
            width,
            transition: {
                duration: isResizing ? 0 : GUIDE_ANIMATION_DURATION_MS / 1000,
                bounce: 0,
            },
        }}
        exit={{
            width: 0,
            transition: {
                duration: GUIDE_ANIMATION_DURATION_MS / 1000,
                bounce: 0,
            },
        }}
    >
```

## After

Two options, in order of preference:

1. **Slide instead of squeeze** — keep the panel at its full `width` for the whole animation and
   animate `x` (framer's `translateX`, compositor-only), letting the shell adopt the panel's
   width in a single layout at animation start (open) / end (close):

```tsx
<motion.div
    data-testid="@guide/panel"
    style={{ overflow: 'hidden', width }}
    initial={{ x: isFirstRender ? 0 : width }}
    animate={{ x: 0, transition: { duration: isResizing ? 0 : GUIDE_ANIMATION_DURATION_MS / 1000, bounce: 0 } }}
    exit={{ x: width, transition: { duration: GUIDE_ANIMATION_DURATION_MS / 1000, bounce: 0 } }}
>
```

   For the content not to jump, the shell needs to reserve the space up front — i.e. wrap the
   panel in a plain `div` with `width` set (one layout, no animation) and translate the panel
   inside it, clipped by the wrapper's `overflow: hidden`. Visually this is "panel slides in
   from the right" instead of "panel inflates"; the main content snaps to its final width once.

2. **If the squeeze must stay** (product call), the cost is inherent — document it and drop only
   the footer spacer's synchronized `width` animation (`DashboardFooter.tsx:186-195`), which can
   translate its 68 px `Box` instead.

## Why it matters

The guide panel sits **in normal flow** beside the app content (`FreeFocusInside` branch,
`GuideRouter.tsx:145` — the `contentWidth` capping math at `:103-115` exists precisely because
the panel takes real layout space). Animating its `width` 0 ↔ ~350 px over 300 ms
(`GUIDE_ANIMATION_DURATION_MS`, `useGuide.ts:9`) means style + layout of the entire shell —
sidebar, account list, dashboard, the graph — on **every frame, ~18 frames per open and again
per close**. On the dashboard the synchronized footer-spacer animation doubles the invalidation.
This is the same interaction class #30497 measured at 140 ms-long tasks for the asset picker.

## Notes

- **The overlay precedent already exists in this file.** On small viewports (`isGuideOnTop`,
  `GuideRouter.tsx:135-143`) the same `content` renders inside `Modal.Backdrop` — floating over
  the app, where the width animation only lays out the panel subtree. The push-mode fix brings
  desktop closer to that already-accepted behavior.
- `isResizing ? 0` (`:84`) already disables the animation during drag-resize — the drag path is
  *not* part of this issue; `ResizableBox` captures its gesture anchor correctly.
- Honest sizing: guide open/close is a deliberate user action, not a hot loop — the cost is
  ~2 × 18 whole-shell layouts per toggle, felt most over the dashboard graph. Nothing here was
  profiled; worth a before/after trace with the guide toggled over the dashboard.
- Option 1 changes the visual from "content reflows alongside the panel" to "content snaps once,
  panel slides" — a product-visible change that needs a design nod.

<sub>Verified against `issues/perf-performance-dom` at `1eacf16b1d`. Part of #28886, belongs under #30497.</sub>
