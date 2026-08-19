# perf-issues/react-hooks — progress / resume state

Sweep of the repo against [`skills/performance-react-hooks/SKILL.md`](../../skills/performance-react-hooks/SKILL.md).
Nothing is filed on GitHub. These are local drafts for review; the next phase turns them into issues.

- **Base commit:** branch `issues/perf-react-hooks` @ `9e0d5b6a45` (on top of `develop` @ `0c75e6199d`).
  Every `file:line` must be valid at this commit.
- **Excluded (already filed under [#28886](https://github.com/trezor/trezor-suite/issues/28886)):**
  28880, 29027, 29147, 30497, 31109, 31122, 31123, 31124, 31125, 31126, 31127, 31128,
  31129, 31130, 31131, 31132, 31133, 31134, 31136, 31137, 31138, 31139, 31140, 31141,
  31142, 31372, 31374. React-hooks-relevant anchors among them:
    - `packages/suite/src/hooks/wallet/useAccounts.ts:9` destructuring defaults — #31133
    - `useFiatFromCryptoValue` whole-`Rate` selector / `BaseCurrencyValue` + `FiatValue` re-render storm — #28880
    - `TransactionsGraph.tsx` `setWidth` / `GraphYAxisTick` layout-effect refire — #31137
    - "enable React Compiler on web/desktop" as an initiative — #29147 (don't re-file; per-site
      manual-memoization findings are still valid)
- **Also excluded: anything already drafted locally** in
  [`../asymptotic-complexity`](../asymptotic-complexity) (48 docs) and
  [`../scheduling`](../scheduling) (34 docs). Before reporting a finding, check
  `grep -rl "<basename>" perf-issues/asymptotic-complexity perf-issues/scheduling`.
  Hook-adjacent anchors already drafted there: `VirtualizedList.tsx:233`,
  `AccountLabelForOwnAddress.tsx:22`, `TransactionRenderer.tsx:46`, `TokenIconSetWrapper.tsx:26`,
  `useEvmNonceInfo.ts:90`, `useStablecoinYieldListData.ts:111`, `transactionsSelectors.ts:281`,
  `transactionUtils.ts:130` (getOwnEvmNonceSets), `tokenUtils.ts:24`/`:63`,
  `getLocaleSeparators.ts:2`, `prepareDateTimeFormatter.ts:16`, `useUtxoSelection.ts:63`,
  `suiteSyncOutputSelectors.ts:56`, native SearchForm debounce (scheduling `p2-14`), accounts
  sidebar / token-search keystroke filtering (scheduling `p1-12`/`p1-13`), coin-control keystroke
  rescan (scheduling `p2-05`), `TransactionSummary` render-body aggregation (scheduling `p2-06`),
  native graph refetch on navigation (scheduling `p1-17`).
- **Scope boundary:** in scope = the six skill sections (app-aware memoization, render-body
  relocation, referential stability of deps, minimal deps, wasted-memo vs render/request loop,
  `exhaustive-deps` suppressions, `useFreshRef`/`useCurrentRef` misuse) plus
  selector-returns-fresh-reference re-renders (the Redux skill cross-link). Out of scope = pure
  algorithmic complexity (→ asymptotic-complexity), long tasks / deferral (→ scheduling), forced
  layout (→ dom), TanStack-query shape (→ data-fetching) unless it is an effect-refetch loop.

## Repo ground truth (verified at base commit — scanners must not contradict this)

- Web/desktop `packages/suite` `useSelector` (`src/hooks/suite/useSelector.ts:15`) defaults to
  `shallowEqual`: a selector returning a fresh one-level object/array of stable references does
  **not** re-render — but the returned reference is still fresh per call, so any `useMemo` /
  `useEffect` depending on it refires anyway. Report those as dep-stability findings, not
  re-render findings.
- `suite-native` uses react-redux `useSelector` directly (reference equality): a selector returning
  `.filter()`/`.map()`/fresh object re-renders its component on **every store dispatch**. React
  Compiler does not fix this — the fresh reference comes from the store subscription, not from
  unmemoized render work.
- `suite-native` is compiled (`experiments.reactCompiler: true`, `suite-native/app/app.config.ts`);
  don't report "missing useMemo/useCallback/memo" there. Do report: compiler bail-outs
  (react-hook-form `watch()` in a compiled component), unstable effect deps that refetch, unstable
  selector results, derived-state-in-effect.
- `packages/suite`, `suite-common/*`, `packages/components` are **not** compiled — manual
  memoization findings are valid there.
- Stability helpers that already exist: `returnStableArrayIfEmpty`
  (`suite-common/redux-utils/src/selectorsUtils.ts:20`), `createWeakMapSelector` (same file :45),
  `useFreshRef` / `useCurrentRef` (`packages/react-utils`).

## Phase 0 — candidate harvest (grep, no agents)

`_scan/00-candidates.md` — categorized grep hits handed to every scan agent. Status: **done** —
C1 exhaustive-deps disables: 34 · C2 native watch(): 0 (verify — may use different forms API) ·
C2b web bare watch(): 5 · C3 derived useSelector: 52 · C4 `?? []/{}`: ~125 · C5 destructuring
defaults: ~156 · C6 inline Provider value: 23 · C7 JSON.stringify dep: 1 · C8 useFreshRef/
useCurrentRef sites: 41 · C9 account/device-keyed effect files: 31 · C10 setState-first effect
files: 36.

## Phase 1 — scan (raw findings land in `_scan/`)

Batches of 2 agents (a prior audit stalled at 5 concurrent — keep ≤3). Each agent writes its own
`_scan/NN-*.md`: one `## F-NN-x` section per finding with file:line, verbatim Before hunk, skill
section, proposed fix sketch, severity guess (P1 hot/unbounded, P2 real-but-colder, P3 cleanup),
confidence, and a "checked, clean" list. Findings must cite code the agent actually read.

| #   | Area                                                                                                         | Output                          | Status                                    |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------- |
| 1   | `packages/suite/src/hooks` (142 files)                                                                       | `_scan/01-suite-hooks.md`       | **done** — 8 findings (3 P1, 3 P2, 2 P3)  |
| 2   | `packages/suite/src/components/suite` + small dirs (connection, guide, onboarding, firmware, tx-simulation…) | `_scan/02-suite-components.md`  | **done** — 15 findings (5 P1, 4 P2, 6 P3) |
| 3   | `packages/suite/src/components/wallet` + `components/earn` (305 files)                                       | `_scan/03-wallet-earn-comp.md`  | **done** — 9 findings (2 P1, 4 P2, 3 P3)  |
| 4   | `packages/suite/src/views/wallet` (349 files)                                                                | `_scan/04-views-wallet.md`      | **done** — 9 findings (1 P1, 6 P2, 2 P3)  |
| 5   | `packages/suite/src/views` rest (dashboard, settings, onboarding, suite…) + `src/support`                    | `_scan/05-views-rest.md`        | **done** — 8 findings (2 P1, 2 P2, 4 P3)  |
| 6   | `suite-common/*` React surface (formatters, graph, connect-init…)                                            | `_scan/06-suite-common.md`      | **done** — 5 findings (2 P1, 3 P3)        |
| 7   | `packages/components`, `product-components`, `react-utils`, `suite-desktop-ui`                               | `_scan/07-shared-components.md` | **done** — 7 findings (1 P1, 4 P2, 2 P3)  |
| 8   | `suite-native` shared libs (atoms, accounts, device, transaction-management, navigation, forms, graph…)      | `_scan/08-native-shared.md`     | **done** — 4 findings (1 P1, 3 P3)        |
| 9   | `suite-native/module-trading`, `module-earn`, `module-send` (biggest modules)                                | `_scan/09-native-modules-a.md`  | **done** — 10 findings (5 P1, 5 P3)       |
| 10  | `suite-native` remaining `module-*` + `app`                                                                  | `_scan/10-native-modules-b.md`  | **done** — 6 findings (0 P1, 3 P2, 3 P3)  |

### Batch log

| Batch | Areas | Status                                     |
| ----- | ----- | ------------------------------------------ |
| 1     | 1, 2  | done — 23 findings (~690k subagent tokens) |
| 2     | 3, 4  | done — 18 findings                         |
| 3     | 5, 6  | done — 13 findings                         |
| 4     | 7, 8  | done — 11 findings                         |
| 5     | 9, 10 | done — 16 findings                         |

**Phase 1 complete: 81 raw findings, ~3.4M subagent tokens.** All scans ran on sonnet, rolling
≤2 concurrent.

## Phase 2 — triage

Dedupe + prioritise `_scan/*` into `_scan/_docmap.tsv` (docid, filename, source findings, source
scan file). That file is the resume key for phase 3. Status: **done** — 81 findings → 43 documents
(17 P1, 22 P2, 4 batched P3). Merges: F-01-3+F-02-1+F-02-15 (p1-03), F-05-2+F-05-3 (p1-12),
F-09-1..5 (p1-17), F-02-6+F-04-6 (p2-03), F-03-2+F-07-3 (p2-07), F-10-3+F-10-6 (p2-22).

## Phase 3 — write one doc per issue

One file per proposed issue, structure of [#31137](https://github.com/trezor/trezor-suite/issues/31137):
lead paragraph naming the skill section, then `## Where` (permalink to develop), `## Before`,
`## After`, `## Why it matters`, `## Notes`, footer
`<sub>Verified against issues/perf-react-hooks at 9e0d5b6a45. Part of #28886.</sub>`.
Suggested labels when filing: `perf`, `no-QA`; parent #31374 (Memoization, loops and reference
stability) under #28886. Writer house style: `_scan/_writer-brief.md`. Status: **in progress** —
writers run in waves of ≤3 (sonnet), assignments grouped by scan file:
W1 p1-01,p1-02,p1-03,p2-01,p2-02 **done** · W2 p1-04,p1-05,p1-06,p1-07,p2-04 **done** ·
W3 p1-08,p1-09,p2-07,p2-08,p2-10 **done** · W4 p1-10,p2-11,p2-12,p2-13,p2-14 **done** ·
W5 p2-03,p2-15,p2-05,p2-06 **done** · W6 p1-11,p1-12,p2-16,p3-02 **done** ·
W7 p1-13,p1-14,p3-03 **done** · W8 p1-15,p2-17,p2-18,p2-19 **done** ·
W9 p1-16,p2-20,p2-21,p2-22 **done** · W10 p1-17,p3-04 **done** · W11 p3-01 **done** ·
p2-09 was missed by the wave plan and written by the main session directly (verified against both
source files; upstream selector confirmed memoized).

**Phase 3 complete: 43/43 documents on disk** (~2.4M subagent tokens across 11 writers, sonnet).

Writer notes worth keeping (deviations writers made on evidence — the most load-bearing content):

- **p3-01 dropped F-02-14** (TransactionRenderer): asymptotic-complexity `p2-16`'s keyed-selector fix
  already eliminates the render-body re-derivation — nothing additive; reasoning noted in the doc.
- **p3-01 halved F-01-8**: the `state` memo returns the live `account` verbatim, so narrowing its
  deps would freeze `state.account` — only the `defaultValues` half is fixed.
- **p2-12**: naive dep-narrowing has a staleness tradeoff (`buildTokenOptions` embeds whole `account`
  by reference, `AccountAmount` reads `account.balance` off it) — flagged in Notes, not shipped silently.
- **p2-06**: the scan's callback-ref fix doesn't type-check (`Column` ref prop is `RefObject`-only) —
  doc proposes a 3-file restructure instead.
- **p2-04**: proposed memo only holds if `useBluetoothConnection`'s handlers get `useCallback` first —
  flagged as same-PR prerequisite.
- **p1-06**: scan's dep needed `account?.formattedBalance` (union type) and its cross-reference pointed
  at the wrong audit dir — both corrected in the doc.

A filename listed in `_docmap.tsv` with no file on disk is unstarted work:

```bash
cut -f2 perf-issues/react-hooks/_scan/_docmap.tsv | while read f; do
  [ -f "perf-issues/react-hooks/$f" ] || echo "MISSING $f"
done
```

## Phase 4 — verification + README index

Re-check every cited `file:line` against the working tree; write `README.md` index (tables like
`../scheduling/README.md`). Status: **done** — 370 cited anchors across all 43 documents
mechanically re-checked against the working tree at `9e0d5b6a45`: **0 broken**. All docs carry the
required sections and footer (the three `p3-*` batch docs written by W7/W10/W11 nest per-finding
`###` subsections instead of top-level Where/Before/After — content complete, style noted in
README). Code-fence parity checked. `README.md` written: index tables, overlap boundaries, filing
order, writer-deviation digest.

## Done

The audit is complete. Next phase (separate task): turn each document into a GitHub issue —
labels `perf` + `no-QA`, parent #31374, filing order per `README.md`.

## Resuming after a token cut

1. Read this file top to bottom — the status columns are the state.
2. Phase 1: any area `pending` → launch only that area's agent (prompt template lives in
   `_scan/_agent-brief.md`), batch ≤2–3.
3. Phase 2/3: `_docmap.tsv` missing → triage not done; else write missing doc files only.
4. Keep this file updated after every batch — it is the only cross-session state.
