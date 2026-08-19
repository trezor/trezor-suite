# Scan agent brief — react-hooks perf sweep

You are one scan agent in a repo-wide sweep of trezor-suite against
`skills/performance-react-hooks/SKILL.md`. Read that skill file first, end to end. Then read
`perf-issues/react-hooks/PROGRESS.md` — its "Repo ground truth" and exclusion lists are binding.
Your task prompt names your area (directories) and your output file.

## What counts as a finding (the only seven classes)

1. **Unstable hook dependency** — `?? []`, `?? {}`, destructuring/parameter defaults `= []`/`= {}`,
   an inline arrow/object, or a `.filter()`/`.map()`/`.slice()`/spread result feeding a `useMemo`,
   `useCallback` or `useEffect` dep array — directly, or across a hook boundary (value produced in
   component, consumed in a custom hook's memo). `exhaustive-deps` cannot see these. The memo below
   never hits / the effect refires per render.
2. **Effect refetch / render loop** — a `useEffect` that dispatches a fetch/thunk or calls
   `setState`, keyed on an unstable dep (whole `account`/`device` object, fresh array). Classify:
   silent request loop (fetch writes back to store → paced by network), synchronous setState loop,
   or bounded-but-wasteful. This is the highest-value class — look hardest for it.
3. **Selector returns fresh reference** — `useSelector(state => ...map/filter/Object.values/{...})`
   or a non-memoized exported selector that allocates. On native (no shallowEqual): re-render on
   every dispatch. On web (shallowEqual default): absorbed at the component, but still unstable as
   a downstream dep → report as class 1 if it feeds a memo/effect. A memoized selector whose
   argument is a fresh array/object per call (memo never holds) also lands here.
4. **Render-body work that belongs elsewhere** — bare `.find`/`.filter`/`.sort`/`.reduce` over
   `accounts`, `tokens`, `transactions`, `utxos`, `vaults` or similar unbounded lists in a
   component body (web/suite-common only — native is compiled). Only report if the list is real
   (unbounded or user-scaling), not a 5-element constant.
5. **Missing memoization where identity matters (web only)** — context Provider `value={{...}}` /
   inline object recreated per render with many consumers; unstable prop defeating a `memo()`d
   child that is expensive (lists, rows). Don't report generic "could add memo".
6. **Wasted / wrong memoization** — `useMemo`/`useCallback` whose deps are unstable by
   construction (memo never hits, pure overhead); memoizing O(1) arithmetic (only worth reporting
   in a batch cleanup doc); `eslint-disable react-hooks/exhaustive-deps` sites where the lying dep
   array hides a bug or staleness (each is a finding — cite what the array omits); react-hook-form
   `watch()` inside compiled suite-native code (compiler bail-out — the whole component loses
   auto-memoization).
7. **Wrong ref hook for previous-value semantics** — `useFreshRef`/`useCurrentRef` used where the
   code needs the _previous_ value in an effect (transition detection): `useFreshRef` assigns
   during render so the transition is never seen; `useCurrentRef`'s own effect runs first. Also the
   reverse: a manual ref-assign-in-render pattern that should be one of the helpers.

Out of scope (other audits own these): algorithmic complexity of the work itself, long-task
chunking, forced layout, converting fetches to TanStack Query. If a finding is "this filter is
O(n²)" → skip; if it is "this filter re-runs per render because its dep is unstable" → yours.

## Method

1. Start from your area's rows in `perf-issues/react-hooks/_scan/00-candidates.md` (grep harvest) —
   verify each candidate by reading the file. A candidate is not a finding until you've read the
   surrounding hook/component and can say what re-runs and why it matters.
2. Then sweep on your own: prioritize hot paths — per-row components in lists (transactions,
   accounts, tokens, UTXOs), things rendered during discovery/sync, form fields that re-render per
   keystroke, dashboard/graph. Use grep for the class signatures, read the hits.
3. For every reported finding, read enough context to name the _consumer_ that re-runs (which
   memo/effect/child) and the _trigger_ cadence (every render / every dispatch / every keystroke /
   every fiat-rate tick).
4. Check exclusions: `grep -rl "<basename>" perf-issues/asymptotic-complexity perf-issues/scheduling`
   plus the anchor list in PROGRESS.md. If an anchor is already drafted/filed, skip it (note it
   under "checked, already covered").

## Output — write to your assigned `_scan/NN-<area>.md`

For each finding, one section:

````markdown
## F-<areaNN>-<n> — <one-line title: file + what re-runs>

- **Class:** 1–7 (name it)
- **Where:** `path/from/repo/root.tsx:line` (+ every co-anchor)
- **Trigger cadence:** every render of X / every store dispatch / per keystroke / per row
- **Severity guess:** P1 (hot or unbounded) / P2 (real but colder) / P3 (cleanup)
- **Confidence:** high / medium (say what would change your mind)

### Before (verbatim from the file)

```tsx
<exact code, enough lines to compile the picture>
```
````

### Proposed fix

<2–6 lines: the mechanism (module constant / returnStableArrayIfEmpty / narrow the dep to the
primitive / derive-don't-store / move to memoized selector / plain useRef), and any type/import
it needs.>

### Why it matters

<1–3 sentences naming consumer + cadence. No invented numbers — nothing here is measured.>

```

End the file with `## Checked, clean` — the files/patterns you inspected that are fine or already
covered, one line each with a reason. That negative space is kept forever; it saves the next
sweep from re-reading them.

## Honesty rules

- Before hunks verbatim from the working tree; cite lines you actually read.
- No measurements, no invented milliseconds.
- If unsure which class or whether the dep is really unstable at its declaration, say so in
  Confidence and keep it — triage decides.
- Skill contradictions (you find the skill's claim false in code) are findings too — flag them
  loudly; a prior audit caught a deprecated-stub API this way.

## Return value (your final message)

≤8 lines: finding count by severity, the single hottest finding (one sentence), anything that
blocks other areas. Do NOT paste the findings back — they live in your file.
```
