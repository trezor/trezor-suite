# V1 — packages/components + packages/product-components (verified by reading)

Verdicts for every A/B/D candidate line in these packages, plus bulk classification of C lines.
Verified at branch `issues/perf-performance-dom` @ `1eacf16b1d`.

## Findings

### F-01 · P3 · Range.tsx labels measured once in a layout effect, stale forever after

`packages/components/src/components/form/Range/Range.tsx:197-200` — `LabelsComponent` reads
`lastLabelRef.current.getBoundingClientRect().width` in a `useLayoutEffect` with stable deps
(runs once per mount). The read lands mid-commit, when React's DOM mutations have dirtied layout
→ one forced synchronous layout per mount. The value feeds `LabelsWrapper`'s
`grid-template-columns: repeat(n, <px>)` (`:179-184`), so the measured px is then frozen: the
grid never re-adapts when the container resizes or fonts load. A `ResizeObserver` on the last
label supplies the same number post-layout for free *and* keeps it fresh — `Tabs.tsx:98` two
directories up is the in-repo template. Mount-once cost → P3 (rule conformance + resize
staleness), not a measured win. Used by the fee-range slider (one instance per send form).

### F-02 · P3 · EditableText sequences focus with a bare rAF after a state flip

`packages/product-components/src/components/EditableText/EditableText.tsx:219-238` — `focus()`
wraps `valueRef.current.focus()` + range selection in `requestAnimationFrame`, called from
`handleEdit` (`:262-272`) right after `setIsEditable(true)`. The rAF is standing in for "wait
until React has committed the contenteditable attribute" — exactly the misuse the skill calls out
(`ExpandableAssetRowTokens` family): rAF guarantees nothing about React's commit. If the callback
runs before the re-render lands, `focus()` targets a still-non-editable div and silently no-ops
(divs without `contenteditable` aren't focusable), so the caret never appears. The conforming fix
is an effect keyed on `isEditable` — commit order guaranteed, no rAF. Perf cost itself is
negligible (one-off per user action) → P3, correctness-adjacent cleanup.

## Checked, clean (do not re-scan)

| Site | Verdict |
| --- | --- |
| `Tabs/Tabs.tsx:82-105` (gBCR `:86`, `offsetLeft` `:87`) | **Exemplary.** Reads run in a passive effect (post-paint, layout clean) and inside a `ResizeObserver` callback (post-layout, free); writes go through state into a `transform: translateX() scaleX()` transition with `transform-origin: left` (`:44-47`) — the skill's "good" ProgressBar shape, generalized. Cite as in-repo template. |
| `Tabs/TabsItem.tsx:13,:26-28` | transition of `opacity`/`transform` only — compositor props. |
| `ResizableBox/ResizableBox.tsx:323` | gBCR in mount-once passive effect — layout clean, one cheap read. |
| `ResizableBox/ResizableBox.tsx:457` | gBCR once per gesture start in `handleMouseDown`, cached in `anchorRef` so per-move math never re-reads — this is the "take every read you need, then write" pattern done right. |
| `ResizableBox/ResizableBox.tsx:347` | rAF coalesces pointermove into one state update per frame; no geometry read or DOM write inside — legitimate throttle, not a measurement tool. *(Out-of-scope observation for a future react-hooks pass: `resizeCooldown = createCooldown(150)` at `:319` is recreated every render and sits in `handleResize`'s deps, so the move/up listeners at `:412-452` unsubscribe/resubscribe on every dispatch during a drag.)* |
| `VirtualizedList/VirtualizedList.tsx:152` (`scrollTop`, `clientHeight`) | Reads in a passive scroll listener with no interleaved writes — layout is clean during compositor scroll. The O(items) prefix walk per event is owned by `../asymptotic-complexity/p2-11`; the caller-reset debounce by `../react-hooks/p2-17`. Its own `// TODO: use IntersectionObserver` (`:148`) overstates — IO cannot drive index-based windowing; the listener is the right tool here. |
| `VirtualizedList/VirtualizedList.tsx:131` (`scrollTop = 0` write) | One write per items-identity change, from a passive effect before any same-task read — no interleave. |
| `TruncateWithTooltip.tsx:26-40` | **Exemplary.** `scrollWidth`/`scrollHeight` read inside the `ResizeObserver` callback, compared against observer-supplied `borderBoxSize` — free reads, no rAF. (#31138 already notes this file is correctly unaffected.) |
| `utils/useScrollShadow.tsx:73-101` | All six geometry props read in one batched destructure per scroll/resize event, no writes until React re-renders; gradient toggles `opacity` (paint-only, `pointer-events: none`). Scroll-edge re-render blast radius is owned by `../react-hooks/p1-15`. |
| `form/Select/customComponents.tsx:178-183` | `scrollIntoView({block:'nearest'})` in a mount-only effect, selected option only — one forced pass per menu open, affordable. |
| `EditableText/EditableText.tsx:252,:287,:310` (`scrollLeft = 0`) | One clamping write per cancel/save/delete user action, no reads after — affordable. |
| Components C-lines: `DotIndicator:11-13`, `LoadingContent:15,:33`, `Stepper:16`, `Modal:29`, `Icon:75`, `Menu:53`, `TableRow:28`, `Illustration:36,:41`, `SubTabsItem:11-13`, `TopAddons:9`, `Switch:33-35,:75`, `SelectBar:48-50,:72`, `InputWrapper:20-22`, `CollapsibleBox:69,:90`, `CollapsibleToggleIcon:13`, `Select/customComponents:39`, `EditableText.tsx:61`, `OutlineHighlight:40-41`, `AssetShareIndicator` (framer opacity/pathLength) | Every declaration names paint-only or compositor properties (`background(-color)`, `outline`, `color`, `fill`, `opacity`, `transform`, `filter`). `focusStyleTransition` = `'outline 0.1s ease-out'` (`utils/utils.ts:6`) — named, paint-only. |
| Components keyframes: `Badge` (`badgeIn`/`badgePulse`/`badgeRing`), `Dot` (`popIn`/`dotPulse`/`ringExpand`), `Skeleton` (`SHINE` background-position), `Menu`/`Timerange` (`DROPDOWN_MENU` opacity+translateY), `BottomText` (`slideDown` opacity+translateY), `config/animations.ts` (`FADE_IN` opacity) | opacity/transform/box-shadow/background-position only — no layout property animated anywhere in the design system's keyframes. |

## Rejected candidates (real pattern, deliberate non-issue)

- **`Collapsible/CollapsibleContent.tsx:36-46`** — framer-motion `animate={{ height: 0 ↔ 'auto' }}`,
  0.4 s: lays out the subtree every frame. Rejected because expand/collapse *semantically requires*
  siblings to reflow as the box grows — there is no compositor-only equivalent that keeps the page
  below moving in sync (#30497 itself concedes "replacing height animation isn't straightforward").
  App-wide primitive (`CollapsibleBox` → settings, fees, modals). Worth revisiting only if a
  design change ever allows overlay-style expansion.

## Excluded here (already filed)

`EditableText/utils.ts:59,:64` → #31138 (both rAFs, including the companion edit) ·
`EditableText.tsx:145`, plus every C1 bare-shorthand/`all` line in these packages → #31139 ·
`ProgressBar.tsx:22` → #31128.
