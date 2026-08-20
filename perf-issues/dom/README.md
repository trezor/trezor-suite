# perf-issues/dom — one document per proposed GitHub issue

Issue-ready write-ups from the repo-wide sweep against
[`skills/performance-dom/SKILL.md`](../../skills/performance-dom/SKILL.md).

Each file is the **body of one future issue** on `trezor/trezor-suite`, following the structure
of [#31137](https://github.com/trezor/trezor-suite/issues/31137): a lead paragraph naming the
skill section, then `## Where`, `## Before`, `## After`, `## Why it matters`, `## Notes`, and a
verification footer. The two `p3-*` batch documents keep the same flow but nest per-finding
numbered subsections (one issue, one PR each).

- **Nothing here is filed yet.** These are drafts for review.
- **Suggested labels**, matching #31137: `perf`, `no-QA`. **Parent:**
  [#30497](https://github.com/trezor/trezor-suite/issues/30497) (Avoid JS methods / CSS props
  causing layout trashing) under [#28886](https://github.com/trezor/trezor-suite/issues/28886).
- **Base commit:** branch `issues/perf-performance-dom` @ `1eacf16b1d` (on top of `develop` @
  `502f5d853a`). All cited `file:line` anchors were verified against that tree.
- **Raw scan output** lives in [`_scan/`](_scan/) — the grep harvest plus three verification
  ledgers with per-site verdicts. The ledgers also carry "checked, clean" tables — negative
  space that saves the next sweep from re-reading — and **rejected candidates with reasons**
  (framer `height: auto` collapse family, `SwitchDeviceModal`), which are worth a skim before
  disagreeing with the set's size.

## Why this set is small

The DOM surface of this codebase is genuinely thin, and the earlier sweep that produced
#30497's sub-issues already took the fattest targets (#31127, #31128, #31134, #31136, #31137,
#31138, #31139 — see [`PROGRESS.md`](PROGRESS.md) for the full exclusion table). What remains
after excluding those and everything drafted in the three sibling audits is: **2 P1, 1 P2, and
2 P3 batches covering 9 small findings**. Several loudly-greppable sites turned out to be the
*good* pattern on reading — `Tabs.tsx`, `TruncateWithTooltip.tsx`, `ResizableBox`'s gesture
anchor, `analytics-docs/scroll.ts` — and the ledgers record them as in-repo templates to cite in
future fixes.

## Before filing, read this

**No number in these documents is a measurement.** Locations, code and mechanisms were verified
by reading; nothing was profiled. Frame counts ("~18 frames per open") are duration ÷ 60 fps
arithmetic, not traces. Both P1 documents explicitly ask for a before/after trace.

**The `After` hunks have not been compiled.** They are written against the surrounding types by
reading, not by running `tsc`.

**Two documents propose product-visible changes.** `p1-01` (panel slides instead of squeezing —
content snaps once) and `p1-02` (send form stops sliding on inner resize, or scopes the slide to
output add/remove) need a design nod, not just review. Both documents state the honest fallback:
keep the behavior, document the cost.

## Overlaps with already-filed issues and sibling drafts (checked, additive — not duplicates)

| Document | Touches | Boundary |
| --- | --- | --- |
| `p1-01` | #31128 | same defect class (animating a layout prop); different mechanism (framer) and blast radius (app shell) |
| `p1-02` | `../react-hooks/p2-11`, `p2-15` | those fix send-form re-render causes; this fixes the layout animation the re-renders feed |
| `p2-01` | #30497 | the skill names this site; the 140 ms asset-picker trace in #30497 is the same interaction |
| `p3-01` item 2 | #31138 | #31138 covers `EditableText/utils.ts`'s two rAFs; this is the third rAF, in `EditableText.tsx` |
| `p3-01` item 3 | #31138 | same "observe() already fires an initial callback" mechanism, different file |
| `p3-02` | #31134 | same package; #31134 is `collapse.tsx`, these are three other files |

Already filed and therefore **not** re-drafted here: `HiddenPlaceholder` (#31127 — and its `:96`
hover read was checked and conforms), `ProgressBar` (#31128), `collapse.tsx` (#31134), FindBar
visibility probe (#31136), `TransactionsGraph`/`GraphYAxisTick` (#31137), `EditableText/utils.ts`
rAFs (#31138), all 16 unnamed-transition declarations (#31139), and the two lint rules
(#31141, #31142).

## Filing order

1. **`p2-01` first** — one-line diff, skill-named site, known-slow interaction. Cheapest credibility.
2. **`p1-02`** — smallest P1 diff (delete a transition line, optionally the observer), core flow.
3. **`p1-01`** — biggest win, needs the design nod; file it with the trace request attached.
4. **`p3-01`**, then **`p3-02`** — conformance batches, whenever hands are free.

## Documents

| Doc | Severity | One line |
| --- | --- | --- |
| [`p1-01`](p1-01-guide-panel-animates-width-relayouts-app-shell.md) | P1 | Guide panel opens by animating `width` — whole app shell lays out every frame, footer spacer animates in sync |
| [`p1-02`](p1-02-send-outputs-transition-measured-height.md) | P1 | Send outputs feed a ResizeObserver-measured height into `transition: height` — layout per frame on every inner size change, including typing-driven validation toggles |
| [`p2-01`](p2-01-asset-picker-expand-toggle-raf.md) | P2 | Asset-picker expand toggle wrapped in rAF "for a fresh frame" — adds one frame of latency, nothing else (skill-named site) |
| [`p3-01`](p3-01-cleanups-dom-suite-and-components.md) | P3 ×6 | Range label measured once then stale; EditableText focus rAF; ResponsiveContext pre-read; NetworkFilter scroll rAF; AddressHistoryRow `margin-left` hover; coinjoin wheel `width`/`height` breathing |
| [`p3-02`](p3-02-cleanups-dom-connect-explorer-theme.md) | P3 ×3 | Docs theme: BackToTop scroll polling; `window.innerWidth` in render body; search overlay `max-height` transition |
