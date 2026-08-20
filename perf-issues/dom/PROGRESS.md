# perf-issues/dom — progress / resume state

Sweep of the repo against [`skills/performance-dom/SKILL.md`](../../skills/performance-dom/SKILL.md).
Nothing is filed on GitHub. These are local drafts for review; the next phase turns them into issues.

- **Base commit:** branch `issues/perf-performance-dom` @ `1eacf16b1d` (on top of `develop` @
  `502f5d853a`). Every `file:line` must be valid at this tree.
- **Scope:** web/desktop only — `packages/`, `suite/`, `suite-common/`. `suite-native/` renders
  through React Native and has no DOM; tests, stories, e2e, fixtures and mocks excluded.
- **Scope boundary (the two skill rules):** in scope = (1) forced-layout geometry reads —
  repetition, read/write interleaving, reads an observer callback could supply for free, rAF
  misuse as a "measurement" tool, scroll/resize listeners that should be observers; (2) CSS
  transitions/animations of layout properties, `transition: all`, bare-duration shorthand — plus
  the same defect expressed through framer-motion (`animate={{ height }}` lays out per frame
  exactly as `transition: height` does). Out of scope = paint-only transitions
  (`background`, `color`, `fill`, `opacity`-adjacent) that name their property — repaint without
  relayout is the conventional hover-state cost and the skill does not ban it; `element.focus()`
  (a11y-required, not called out by the skill); memoization/render loops (→ react-hooks); long
  tasks (→ scheduling); algorithmic cost (→ asymptotic-complexity).

## Excluded — already filed under [#28886](https://github.com/trezor/trezor-suite/issues/28886) / [#30497](https://github.com/trezor/trezor-suite/issues/30497)

DOM-relevant filed issues (30497's sub-issues plus two under 31374). Do not re-draft; a finding
that *extends* one of these must say so and propose extending, not duplicating:

| Filed | Covers (anchors at time of filing) |
| --- | --- |
| [#31127](https://github.com/trezor/trezor-suite/issues/31127) | `suite/discreet-mode/src/HiddenPlaceholder.tsx:83` getComputedStyle layout-effect **and** `:26` `transition: all`. Does **not** cover the `:96` `getBoundingClientRect` hover measurement (survives its After). |
| [#31128](https://github.com/trezor/trezor-suite/issues/31128) | `packages/components/.../ProgressBar/ProgressBar.tsx:22` `transition: width`. |
| [#31134](https://github.com/trezor/trezor-suite/issues/31134) | `packages/connect-explorer-theme/src/components/collapse.tsx:37-40` clientWidth read through own style write. |
| [#31136](https://github.com/trezor/trezor-suite/issues/31136) | `packages/suite/src/components/suite/FindBar/highlight.ts:20-21` offsetParent + getComputedStyle visibility probe per text node. |
| [#31137](https://github.com/trezor/trezor-suite/issues/31137) | `TransactionsGraph.tsx:78` unstable `setWidth` → `GraphYAxisTick.tsx:34` getBoundingClientRect layout-effect refire (notes ResizeObserver as the proper fix). |
| [#31138](https://github.com/trezor/trezor-suite/issues/31138) | **Both** rAFs in `packages/product-components/src/components/EditableText/utils.ts:59,:64` (redundant rAF around ResizeObserver + leak). Does **not** cover `EditableText.tsx` rAF at `:220` or the `scrollLeft` writes. |
| [#31139](https://github.com/trezor/trezor-suite/issues/31139) | All 16 unnamed-transition declarations: `Card.tsx:50`, `Box.tsx:56`, `TextButton.tsx:55`, `buttons/utils.ts:56`, `form/utils.ts:61`, `FloatingLabel.tsx:17`, `Radio.tsx:35`, `EditableText.tsx:145`, `ActionsContainer.tsx:43`, `GuideButton.tsx:34+:51`, `NavigationItem.tsx:32`, `AccountRow.tsx:17`, `ConnectPermissions.tsx:70`, `PasswordStrengthIndicator.tsx:35`, `GuideImage.tsx:17` (+ `HiddenPlaceholder.tsx:26` → #31127; `ReactToastifyStyles.tsx:323` vendored, exempt). Section C1 of the harvest is therefore **fully covered**. |
| [#31141](https://github.com/trezor/trezor-suite/issues/31141) | stylelint rule banning `transition: all` / bare shorthand — don't re-propose tooling. |
| [#31142](https://github.com/trezor/trezor-suite/issues/31142) | eslint `no-restricted-properties` for forced-layout reads — don't re-propose tooling. |
| [#30497](https://github.com/trezor/trezor-suite/issues/30497) | Parent initiative; names `useAnchor` as already fixed — `suite/router/src/useAnchor.ts` is the skill's **good** worked example, not a finding. |

**Also excluded: anything already drafted locally** in
[`../asymptotic-complexity`](../asymptotic-complexity), [`../react-hooks`](../react-hooks),
[`../scheduling`](../scheduling). Before drafting, run
`grep -rl "<basename>" perf-issues/{asymptotic-complexity,react-hooks,scheduling} --include='p*.md'`.
Known adjacent drafts: VirtualizedList (complexity `p2-11` prefix sums; react-hooks `p2-17`
scroll debounce), useScrollShadow (react-hooks `p1-15` Table context identity), Sidebar
(react-hooks `p1-01`/`p1-02`/`p1-11`, scheduling `p1-13` — renders/filtering, not the resize
listener), Tabs (react-hooks `p3-03` cleanup), ExpandableAssetRowTokens opacity gate (react-hooks
`p1-01` touches SuiteLayout, not this) — the DOM angle on these files is unclaimed unless a doc
here says otherwise.

**Vendored, exempt:** `packages/blockchain-link/src/ui/spectre.min.css`,
`packages/connect-explorer-theme/css/*`, `ReactToastifyStyles.tsx` (stylelint-disabled vendored
block), `packages/connect-examples/**` (sample code, not shipped app).
`packages/connect-explorer-theme/src/**` is a forked Nextra theme but got its own filed issue
(#31134), so it stays in scope at reduced priority (docs site, not the wallet).

## Repo ground truth (verified at base commit)

- Reads inside `ResizeObserver`/`IntersectionObserver`/`MutationObserver` callbacks run **after**
  layout and are free — do not flag them. Reads inside `requestAnimationFrame` run **before**
  style/layout and are cheap only if nothing invalidated layout earlier in the frame; a write in
  rAF forces layout exactly as anywhere else.
- Web/desktop is **not** compiled by React Compiler; framer-motion is the in-house animation kit
  (`motionEasing` from `packages/components/src/config/motion.ts`).
- `packages/env-utils` `getWindowWidth`/`getWindowHeight` are window-geometry reads used from
  analytics call sites — flag only if called per-event/per-render.

## Phases

| Phase | What | Output | Status |
| --- | --- | --- | --- |
| 0 | grep candidate harvest | [`_scan/00-candidates.md`](_scan/00-candidates.md) | **done** |
| V1 | verify: `packages/components` + `product-components` (geometry, rAF, observers, keyframes, multi-line transitions) | `_scan/01-components.md` | **done** |
| V2 | verify: `packages/suite` + `suite/*` + `suite-common` (geometry, rAF, framer height/width, transitions) | `_scan/02-suite.md` | **done** |
| V3 | verify: `connect-explorer(-theme)` + `analytics-docs` + `suite-web`/`desktop` + `env-utils` | `_scan/03-satellites.md` | **done** |
| W | write per-issue docs + README from `_scan/0[123]-*.md` | `p1-*.md`, `p2-*.md`, `p3-*.md`, `README.md` | pending |
| F | verify every cited `file:line` mechanically, commit, push, draft PR → base `issues/perf-react-hooks` | PR | pending |

Resume rule: pick the first phase not marked **done**; each verify phase appends to its own
`_scan/` file, so a killed session loses at most one file. The harvest regenerates with
`_scan/harvest.sh`.

## Verification batches (V1–V3) — candidate → verdict ledger

The `_scan/0N-*.md` files carry the full verdicts (finding / clean / excluded, with reasoning).
Every A/B/D-section candidate line from `00-candidates.md` must appear in exactly one ledger.
C-section lines are classified in bulk: paint-only named transitions are recorded once per file as
clean, layout-prop and unnamed ones individually.
