# V2 — packages/suite + suite/* + suite-common (verified by reading)

Verified at branch `issues/perf-performance-dom` @ `1eacf16b1d`.

## Findings

### F-03 · P2 · ExpandableAssetRowTokens wraps the expand toggle in a rAF that grants nothing

`packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx:55-60`
— the toggle's `onClick` wraps `onExpandToggle(account.key, !expanded)` in
`requestAnimationFrame` with the comment *"The operation will be probably expensive. Ask for
fresh frame before switching the state."* This is the exact example the skill names (`:56`, now
`:57` after drift): rAF callbacks run at the *top* of the next frame, before style/layout, so the
expensive state switch + token-row render still lands inside that same frame — the only effect is
one added frame (~16 ms) of input latency on a path #30497 already measured as a 140 ms long
task. Fix: call the toggle directly; if paint-the-caret-first is genuinely wanted, that is a
scheduling-skill tool (`startTransition`), not rAF. Contrast with `:14-22` in the same file,
which is the *good* pattern (computed px height + opacity-only transition + `will-change`).

### F-04 · P2 · Guide panel opens by animating `width`, re-laying-out the whole app shell per frame

`packages/suite/src/components/guide/GuideRouter.tsx:74-95` — the guide panel is a
`motion.div` animating `width` 0 ↔ `width` (~350 px) over `GUIDE_ANIMATION_DURATION_MS`. The
panel sits beside the app content, so every animation frame resizes the main content column —
style + layout of the entire app shell (sidebar, account list, dashboard/graph) per frame for the
whole duration, on every guide open/close. `packages/suite/src/views/dashboard/DashboardFooter.tsx:186-193`
animates a spacer `width: isGuideOpen ? 0 : 68` in sync — same family, same PR. Honest framing:
a *push* panel semantically reflows content, so the compositor-only fix is a UX call — overlay
the panel (`position: fixed` + `transform: translateX`, content reflows once at animation end or
not at all). If push stays, the layout cost is inherent and the issue documents the price. Worth
measuring before/after with the guide open over the dashboard graph.

### F-05 · P2 · Send-form outputs animate a ResizeObserver-measured `height` on every inner size change

`packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:20-23` (`transition: height 0.2s` on
`Container`) + `:44-56` (ResizeObserver feeding `setHeight(entry.contentRect.height)`). Every
change of the form's intrinsic size — validation row appearing under Amount, token select
opening, output added/removed, fiat toggle — resizes the inner div, the observer sets a new px
height, and the CSS transition then animates `height` for 0.2 s: style + layout of the send form
and everything below it on every frame (~12 frames), on interactions as small as a keystroke that
toggles an error message. The observer read itself is free (contentRect, post-layout) — the
defect is transitioning the layout prop. Options, honestly: (a) drop the transition — content
snaps, zero per-frame cost, smallest diff; (b) the in-repo good pattern for known content:
computed height + opacity (`ExpandableAssetRowTokens.tsx:14-22`); (c) keep the smooth-resize UX
and accept the documented cost. The measured-height + `transition: height` combo also
double-animates when several inner changes land in quick succession.

### F-06 · P3 · useResponsiveContextOnChange pre-reads gBCR that the observer's initial callback already delivers

`packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:37-39`
— after constructing the ResizeObserver, the effect reads `ref.current.getBoundingClientRect()`
and calls `setContentWidth(rect.width)` manually, then `observe()`s. `observe()` already fires an
initial post-layout callback with the same geometry for free (the #31138 mechanism). The manual
read exists to skip the `debounce()` on first delivery — fix by bypassing the debounce when
`lastWidthRef.current === null` inside the callback and deleting the pre-read. Cost today is one
cheap post-paint read per SuiteLayout mount (~0) — this is rule conformance + one less way to
diverge from the observer path.

### F-07 · P3 · useNetworkFilter sequences a list scroll reset with rAF instead of the existing keyed-effect hook

`packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useNetworkFilter.ts:64-66`
— after `dispatch(goto(...))` the effect does `requestAnimationFrame(() => listRef.current?.scrollTo({top: 0}))`.
The rAF is standing in for "after the dispatch-driven re-render lands" — rAF guarantees no such
ordering relative to React's commit. The same feature already owns the right tool:
`asset-picker/hooks/useListScrollReset.ts` (an effect keyed on a list fingerprint). One-off per
filter change, so P3 rule conformance, same family as F-02.

### F-08 · P3 · AddressHistoryRow hover transitions `margin-left`, re-laying-out the row per frame

`suite/receive/src/AddressHistoryRow.tsx:44-47` — `Actions` transitions
`opacity, transform, margin-left`; `margin-left` flips 0 ↔ 24px via `Label:hover + &` (`:53-59`).
Every hover over a label in the receive-page address history animates a layout property for
0.2 s: the row's flex line (and the min-width-0 label next to it, which re-truncates) lays out
per frame. Nuance the fix must respect: the margin *makes room* for the labeling edit button
(comment `:22-25`) — a pure `translateX` would overlap instead of yielding space. Smallest
conforming fix: remove `margin-left` from the transition list (the gap snaps, opacity/transform
still animate). Row count is small (visible addresses), so P3.

### F-09 · P3 · Coinjoin wheel inner circle transitions `width`/`height` for a 4 px breathing effect

`packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressContent.tsx:20-29`
— `Container` (the solid circle fill) transitions `width`+`height` between `calc(100% - 12px)`
and `calc(100% - 8px)` on session state flips. Layout of the wheel subtree per frame for 0.15 s.
The circle is a solid `border-radius: 50%` fill — the skill's "safe scale" case — but today it
has a child (`CenteringContainer`, `:198-200`), which scale would distort. The overlay is
absolutely positioned with a fixed 80 px box, so hoisting it out to a sibling is visually
identical and leaves a childless fill: then `transform: scale()` + `transition: transform`
replaces both layout props. Small, contained subtree → P3.

## Checked, clean (do not re-scan)

| Site | Verdict |
| --- | --- |
| `suite/discreet-mode/src/HiddenPlaceholder.tsx:96` (gBCR in `onMouseEnter`) | One read per hover-enter, *before* any same-task write (state lands after the handler) — conforms to "take reads before writes". The `min-width` it feeds is #31127's territory. Resolves the open question in PROGRESS.md: no third HiddenPlaceholder defect. |
| `packages/suite/src/hooks/suite/useResetScrollOnUrl.ts:16-30` | `scrollTop = 0` in a `useLayoutEffect` per URL change — deliberately pre-paint to avoid a one-frame flash of stale scroll; one forced pass per navigation, no reads after. Affordable by design. |
| `packages/suite/src/components/guide/GuideMarkdown.tsx:19-23`, `asset-picker/hooks/useListScrollReset.ts:7-9`, `SelectBackupType/FloatingSelections.tsx:133-139` (post-animation), `SolStakingDashboard/Rewards/RewardsList.tsx:33-38`, `TransactionList/TransactionList.tsx:112-123`, `TransactionReviewOutputList.tsx:136-144` | One-off `scrollTo`/`scrollIntoView` per user action / step change / article navigation — single forced pass, event-driven, no repetition. |
| `SuiteLayout/Sidebar/Sidebar.tsx:125-130` | `resize` listener body is `setAutoCollapseSuppressed(false)` — no geometry read; semantically about user intent (window resize re-enables auto-collapse), so a listener, not an observer, is the right tool. |
| `FindBar/useFindInPage.ts:45-61` (rAF `:53`) | Observer hygiene: pauses the MutationObserver around its own mutations, drains `takeRecords()`, re-arms next frame. No geometry read/write in the rAF. |
| `FindBar/useFindInPage.ts:68-92` | Attribute writes batched over all marks, one optional `scrollIntoView` per next/prev action; `:94-110` pulses via WAAPI `transform`/`opacity` — compositor. `:224` MutationObserver is the feature's core; the per-node visibility probe is #31136. |
| `packages/suite/src/hooks/suite/useClearAnchorHighlightOnClick.ts:22-25` | rAF defers a `click` listener *attach* — no layout read/write involved; correctness quirk at most, outside this skill. |
| `StakingDashboard/components/ProgressLabels/ProgressLabel.tsx:123-138` | `clientHeight` read inside the ResizeObserver callback — post-layout, free. (Hooks-family nit, not for this audit: effect keyed on `currentHeight` recreates the observer per change; `entry.borderBoxSize` would also beat re-reading the ref.) |
| `packages/suite-web/src/index.ts:7-20`, `static/vite-index.ts:5` | Bootstrap MutationObserver, disconnects on first hit — one-shot by construction. |
| `packages/env-utils/src/envUtils.ts:36-38` + `suite-common/logger/src/utils.ts:206-207` | `window.innerWidth/Height` read once per log-event payload — not per-frame/per-render. |
| Suite C-lines, paint/compositor only | `CarouselIndicator:23-25` (background-color/opacity), `Pagination:34-36` (background/color), `CoinjoinProgressWheel:79-81` (background/opacity) + `DELAYED_SPIN` keyframe (`:29-35`, transform), `CoinjoinStatusBar:24,:36` (transform/background), `DeviceSelector:25`, `AmountUnitSwitchWrapper:20`, `StakeAmountWrapper:20`, `CoinsFilter:16` (outline), `DropdownRow:13` (transform), `TransactionItemBlurWrapper:8` (filter — compositor), `OptionWithContent:45` (background), `support/suite/styles/animations.ts` (all four blocks: opacity/transform), `SendHeader:25` + `BundleLoader:13` (`FADE_IN` opacity), `GlobalStyle.tsx:15` (suite-desktop-ui, transform/background), `AccountDetails:99` (y/opacity), `SettingsCoins:44` (y/opacity), `CoinsFilter:58` (opacity), `ConnectDeviceGlobalModal:163` (x), `RotatingFacts:72`, `RotatingPhrases:55`, `PrerequisitesGuide:26,:37` (opacity/y). |
| `Toaster/ReactToastifyStyles.tsx` | Vendored react-toastify inside a stylelint-disabled block (#31139 precedent): exempt. Its own hot-path lines (`:169`, `:174`, `:373`) are transform/opacity anyway; the `Toastify__trackProgress` keyframe animates `transform: scaleX` (`:348`). |

## Rejected candidates (real pattern, deliberate non-issue)

- **Framer `height: 0 ↔ 'auto'` collapse family** — `SettingsLayout.tsx:98-103` (discovery
  banner), `SettingsGeneral/Experimental.tsx:86-96` (+`marginTop`), `AnonymityLevelSetup.tsx:38-42`,
  `PassphraseInputCard.tsx:46-52`, `ActivateAssetsModal.tsx:16-35` + `banner-animations.ts:1-16`
  (dismiss-collapse), same verdict as `CollapsibleContent` in V1: expand/collapse semantically
  requires siblings to reflow; all are one-off event-driven (discovery start, banner dismiss,
  modal step), not hover/scroll-frequency. Not filed.
- **`SwitchDevice/SwitchDeviceModal.tsx:54-65`** — modal body animates `width`/`height: auto`
  once per open; it floats over the page (backdrop), so the per-frame layout is confined to the
  modal subtree and nothing below reflows. Not filed.

## Excluded here (already filed)

`HiddenPlaceholder.tsx:83` + `:26` → #31127 · `GraphYAxisTick.tsx:34` → #31137 ·
`highlight.ts:20-21` → #31136 · `AccountRow.tsx:17`, `NavigationItem.tsx:32`, `GuideImage.tsx:17`,
`GuideButton.tsx:34,:51`, `ConnectPermissions.tsx:70` → #31139.
