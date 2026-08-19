# Writer brief — one document per proposed GitHub issue (react-hooks sweep)

You write issue-ready documents into `perf-issues/react-hooks/`. Each document is the body of one
future GitHub issue on `trezor/trezor-suite`. Follow this brief exactly; it is the house style for
the whole set.

## Inputs you must read first

1. This file.
2. `skills/performance-react-hooks/SKILL.md` — name the skill section your finding belongs to.
3. Your assigned `## F-*` section(s) in the `_scan/NN-*.md` file named by your assignment.
4. **The actual source files** — re-read every cited location in the working tree before writing.
   The scan's Before hunk is a claim, not a fact; if the code differs, the file wins and you adjust
   (and say so in Notes).

## Document structure (structure of issue #31137 — keep the section order exactly)

````markdown
<Lead paragraph: one or two sentences. "Extracted from the `skills/performance-react-hooks/SKILL.md`
audit — section _"<section name>"_. Found by sweep, not named in the doc.">

## Where

[`<repo-relative-path>:<line>`](https://github.com/trezor/trezor-suite/blob/develop/<path>#L<line>)
<one bullet or line per co-anchor if more than one>

## Before

```tsx
<verbatim code from the working tree — enough lines that a reviewer sees the defect without opening
the file; include the dep array for hook findings>
```
````

## After

```tsx
<the proposed fix, compiling against the surrounding types as best you can tell by reading; keep
the diff minimal — this is a proposal, not a patch>
```

## Why it matters

<1–3 sentences: the consumer that re-runs, the trigger cadence (every render / every store dispatch /
every keystroke / every fiat tick / every background account update), and what that costs the user.
NO INVENTED NUMBERS — nothing in this sweep was measured. If you cite a figure it must come from a
linked issue that measured it, attributed.>

## Notes

<bullets: compile requirements (imports/types the After needs), which app consumes this (web is
uncompiled / native is compiled — for native code do NOT propose adding manual memoization; fix the
reference at its source), adjacent clean code worth mentioning, the in-repo "correct sibling" if the
scan found one (this is the strongest evidence — cite it), honest sizing if n is small, optional
same-PR cleanups.>

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>

```

## Rules

- **Permalinks** point at `blob/develop/...#L<n>` (the branch will merge; develop is where reviewers
  read). The `file:line` text itself must be valid at 9e0d5b6a45 in the working tree.
- **Title** (used as filename + README row, and later the issue title): one sentence, active voice,
  names the component/hook and the defect — e.g. "CoinControl refetches UTXO transactions on every
  account object churn". Filename: `p<severity>-<nn>-<kebab-title-trimmed>.md`.
- **Severity** comes from your assignment row (triage already decided it); do not re-rank, but if
  the code you re-read contradicts the scan (defect absent, already fixed, dep actually stable),
  STOP writing that doc and report it back instead — a wrong issue is worse than a missing one.
- **Fix mechanism vocabulary** (pick what the skill prescribes): narrow the dep to the primitive
  (`account.key`, `accountKey`, `symbol`); module-level constant for `[]`/`{}` fallbacks;
  `returnStableArrayIfEmpty` in selectors; memoized selector (`createWeakMapSelector`) instead of
  render-body derivation; `useMemo` around a Provider value or expensive derivation (web only);
  derive-don't-store instead of setState-in-effect; plain `useRef` assign-at-end for previous-value
  semantics; scoped `watch('field')`/`useWatch` instead of bare `watch()`.
- **Native docs**: the fix is never "add useMemo" — the compiler owns memoization. Fix the source of
  the unstable reference (selector, dep narrowing, derive in render).
- **No cross-doc dependencies**: each document must stand alone when pasted into a GitHub issue.
  Reference other *filed* issues by number; reference sibling drafts by their `p*-nn` id in Notes
  only, marked "(sibling draft, not yet filed)".
- Suggested labels when filing (goes nowhere in the doc body): `perf`, `no-QA`; parent #31374.
```
