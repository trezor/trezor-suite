# perf-issues/scheduling — progress / resume state

Sweep of the repo against [`skills/performance-scheduling/SKILL.md`](../../skills/performance-scheduling/SKILL.md).
Nothing is filed on GitHub. These are local drafts for review.

- **Base commit:** `develop` @ `77d47ea064`
- **Excluded (already filed under [#28886](https://github.com/trezor/trezor-suite/issues/28886)):**
  28880, 29027, 29147, 30497, 31109, 31122, 31123, 31124, 31125, 31126, 31127, 31128,
  31129, 31130, 31131, 31132, 31133, 31134, 31136, 31137, 31138, 31139, 31140, 31141,
  31142, 31372, 31374
- **Also out of scope:** anything whose fix is "index it in a Map/Set" (that is
  `performance-complexity`, already drafted in [`../asymptotic-complexity`](../asymptotic-complexity)),
  memoization/deps (`performance-react-hooks`), forced layout (`performance-dom`).

## Phase 1 — scan (raw findings land in `_scan/`)

| #   | Area                                                                          | Output                        | Status   |
| --- | ----------------------------------------------------------------------------- | ----------------------------- | -------- |
| 1   | Suite web/desktop startup & critical path                                     | `_scan/01-suite-startup.md`   | **done** |
| 2   | wallet-core thunks, reducers, middleware                                      | `_scan/02-wallet-core.md`     | **done** |
| 3   | suite-native startup & RN long tasks                                          | `_scan/03-native.md`          | **done** |
| 4   | blockchain-link workers, coinjoin, connect                                    | `_scan/04-workers.md`         | **done** |
| 5   | React render scheduling (web)                                                 | `_scan/05-render.md`          | **done** |
| 6   | Non-essential work: analytics, logging, message-system, definitions, prefetch | `_scan/06-nonessential.md`    | **done** |
| 7   | Storage / IDB / persistence                                                   | `_scan/07-storage.md`         | **done** |
| 8   | Crypto, parsing, export/QR/PDF heavy sync                                     | `_scan/08-heavy-sync.md`      | **done** |
| 9   | suite-native lists, Hermes-side heavy JS                                      | `_scan/09-native-render.md`   | **done** |
| 10  | Desktop main/preload, connect-popup/iframe                                    | `_scan/10-desktop-connect.md` | **done** |

### Batch log

| Batch    | Areas                                   | Workflow run      | Status             |
| -------- | --------------------------------------- | ----------------- | ------------------ |
| 1        | 1–5                                     | `wf_049e8d4d-085` | done — 27 findings |
| 2        | 6–10                                    | `wf_0e3495de-ea0` | done — 16 findings |
| A (docs) | p1-01…p1-06, p2-01                      | `wf_9527ff70-fb3` | done — 7 docs      |
| B (docs) | p1-07…p1-11                             | `wf_14ac007a-e72` | done — 5 docs      |
| C (docs) | p1-12…p1-15, p2-05, p2-06, p2-07, p2-12 | `wf_94e3f99e-2f5` | running            |

A batch is resumable with `Workflow({scriptPath: <script>, resumeFromRunId: <run>})`; scripts live in
the session's `workflows/scripts/` dir. Completed agents return cached results, so only the missing
areas re-run.

## Phase 2 — triage

Dedupe + prioritise `_scan/*` into the issue list in `README.md`. Status: **done** — 43 raw
findings merged into 34 documents (17 P1, 16 P2, 1 batched P3). Merges are listed at the bottom of
`README.md`. Filenames are fixed in `_scan/_docmap.tsv` (docid, filename, source findings, source
scan file) — that file is the resume key for phase 3.

## Phase 3 — write one doc per issue

One file per proposed issue, structure of [#31137](https://github.com/trezor/trezor-suite/issues/31137):
lead paragraph naming the skill section, then `## Where`, `## Before`, `## After`,
`## Why it matters`, `## Notes`, verification footer. Status: **done — 34/34** — see `_scan/_docmap.tsv`. **A filename listed there with
no file on disk is unstarted work.** Check with:

```bash
cut -f2 perf-issues/scheduling/_scan/_docmap.tsv | while read f; do
  [ -f "perf-issues/scheduling/$f" ] || echo "MISSING $f"
done
```

### Writer inputs — both live in the repo, so any retry is a one-line launch

- [`_scan/_writer-brief.md`](_scan/_writer-brief.md) — skill summary, repo ground truth, document
  structure, honesty rules. Edit it to change house style for every remaining document.
- [`_scan/_doc-instructions.md`](_scan/_doc-instructions.md) — the per-document instructions for
  every document not yet written.

A writer agent needs only: "read `_writer-brief.md`, then the `## <id>` section of
`_doc-instructions.md`, then write the document". Nothing else has to be reconstructed.

### Note for a future session: batch size

Batch C ran 5 concurrent writers and **all five stalled** (no progress for 180 s × 6 attempts),
burning ~2.8 M subagent tokens and writing nothing. Batches A and B ran 5 concurrent successfully,
so this looks like transient infrastructure rather than a prompt problem — but **retry at 2–3
concurrent**, not 5. Losing a 3-agent batch is cheap; losing a 5-agent batch is not.

## Findings that change things outside this report

- **`skills/performance-scheduling/SKILL.md` is wrong about `InteractionManager`.** It is a
  deprecated stub on this repo's React Native — `runAfterInteractions` is a bare `setImmediate`,
  `setDeadline` is `// Do nothing.`. Verified at HEAD in
  `node_modules/react-native/Libraries/Interaction/InteractionManager.js`. The skill should be
  corrected regardless of whether any issue here is filed. See README for the full statement.
- **`@trezor/utils` gains two published exports** (`yieldToMain`, `runWhenIdle`) the first time any
  of these issues lands. That is a published-API addition, worth a heads-up to whoever owns the
  package.

## Phase 4 — verification (done)

1,136 cited anchors across 328 source files re-checked mechanically against the working tree at
`77d47ea064`: **0 broken**. All documents carry the required sections and the footer.

## Next phase — filing

Nothing is filed. When turning these into GitHub issues:

1. **File `p1-07` first.** It is the skill's own `bad` example and the designated first consumer of
   `yieldToMain`; it specifies the helper in full and every other document defers to it. `p1-01` or
   `p1-03` establishes `runWhenIdle` the same way.
2. Labels `perf`, `no-QA`; parent #28886 — matching #31137.
3. Read each document's **Notes** before filing: several writers overrode their own scan input on
   evidence (`p1-10` on `InteractionManager`, `p1-11` on the transform's real complexity, `p2-07` on
   the `setTimeout` not chunking at all, `p3-01` item 1 on the skill's own example). Those
   disagreements are the most load-bearing content in the set.
4. Two `SKILL.md` corrections are owed regardless of filing — see the README section.

## Resuming

1. Read this file's status column.
2. Anything `pending` in phase 1 → re-run only that area's agent.
3. Phase 3 is per-file; a missing `pNN-*.md` for a row in `README.md` is unstarted work.
