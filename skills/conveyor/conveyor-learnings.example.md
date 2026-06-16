<!--
conveyor-learnings.example.md — the cross-run memory the stations read before they cold-start.

Put the real one at .github/conveyor-learnings.md in your product repo. It is the
durable, codebase-specific knowledge the agents accumulate so each run stops
re-discovering the same gotchas: build-order quirks, recurring bug classes, "this
package needs X", conventions found the hard way. Every conveyor station reads the
entries whose `area` matches what it is touching, before it starts work.

This is an EXAMPLE/template — the real file is per-repo and grows over time. The
header rules below travel with the real file (keep them at the top).

== How it works ==

- **Versioned + PR-gated.** This is a checked-in markdown file. A learning is
  captured by **appending an entry inside the implementation PR that discovered it**
  — so the learning rides the same diff and gets **human-reviewed at the merge gate
  before it becomes trusted**. The PR merge IS the promotion event; a `source: agent`
  entry that a human waved through at merge is exactly as trusted as the code it
  shipped with. There is no per-use success counter — trust comes from the merge
  review, not from a runtime tally.

- **Append-only, latest-winner.** Never rewrite or delete history to "fix" a
  learning. A correction is a NEWER entry with the same `key` that supersedes the
  older one; the most recent entry for a key wins. The old entry stays as the record
  of what we used to believe.

- **Confidence + decay.** Each entry carries a `source` and a `confidence` 1-10.
  - `source: human` (or an `agent` entry a human confirmed) is applied **without
    caveat** — it cleared the merge gate on a human's authority.
  - An unconfirmed `source: agent` entry **decays**: knock its confidence down over
    time (rule of thumb: -1 per ~30 days unreconfirmed, floor 1) and whenever a run
    relies on it and it does NOT hold. A reader treats a decayed agent entry as a
    *hint to verify*, not a fact. Reconfirming it (a human ticks it, or a later PR
    re-asserts it) resets confidence and may flip `source` to human-confirmed.

- **Garbage collection** (do this when you touch this file, don't let it rot):
  - **Staleness:** if an entry references a file/symbol/script that no longer exists
    (deleted package, renamed export), drop it — the knowledge is moot. Note the
    removal in the PR that does the GC so the deletion is itself reviewed.
  - **Conflict:** if two entries with DIFFERENT keys contradict each other, do NOT
    silently pick one. **Keep both** and tag each with `conflict: <other-key>` so the
    next reader surfaces the clash for a human to settle. (Same-key contradictions
    are not conflicts — that is the normal latest-winner supersede.)

== Entry format ==

One `###` block per entry. Fields:

| Field | Meaning |
| --- | --- |
| heading | `### <key> — <one-line learning>` — `key` is short, stable, kebab-case; reused verbatim when superseding |
| `area` | package / surface this applies to (matches a plan's "Affected areas"); a station reads entries whose area it touches |
| `learning` | one line, actionable — what to DO, not just what is true |
| `source` | `human` or `agent` |
| `confidence` | 1-10 (decays for unconfirmed `agent` entries) |
| `seen` | `YYYY-MM-DD` first captured |
| `from` | the issue/PR it came from (`#NNNNN`) |
| `supersedes` | (optional) an earlier entry's `from` ref this one corrects |
| `conflict` | (optional) the key of a contradicting live entry, for a human to settle |

Newest entries go at the BOTTOM (append-only), so the file reads in capture order.
-->

# Conveyor project learnings — EXAMPLE

> Keep the rules in the comment above at the top of the real file. Below are sample
> entries in the format. Replace them with your repo's real, hard-won knowledge.

### suite-web-buffer-no-bigint — Suite Web's `buffer` polyfill lacks 64-bit writes
- area: suite-web, connect
- learning: `buffer@5.x` shipped to Suite Web has no `writeBigInt64LE` / `writeBigUInt64LE`; use a `DataView` for any 64-bit integer write or BTC signing breaks at runtime (units pass, browser fails).
- source: human
- confidence: 10
- seen: 2026-02-18
- from: #27538

### nx-affected-build-order — build deps before running `nx affected`
- area: monorepo, ci
- learning: `nx affected` does not build a changed package's upstream deps for you; build `suite-data` + `message-system` first or affected type-check/e2e fails on missing generated output. Order: deps → generate → affected.
- source: agent
- confidence: 6
- seen: 2026-03-30
- from: #28140

### rebase-breaks-typecheck — type-check locally after every rebase, tests aren't enough
- area: monorepo, ci
- learning: Rebasing onto `develop` can silently auto-merge files so jest still passes but type-check breaks (e.g. TS2552 from a newly-added literal); run `nx affected -t typecheck` locally before force-pushing, don't trust a green test run.
- source: human
- confidence: 9
- seen: 2026-04-12
- from: #28324

### connect-settings-parser-drops-fields — add new ConnectSettings fields to the parser
- area: connect, connect-common
- learning: `parseConnectSettings` copies fields one-by-one, so any NEW `ConnectSettings` field is silently dropped before `Core.init` unless you add it there too — symptom is the feature flag "doing nothing" with no error.
- source: agent
- confidence: 7
- seen: 2026-05-09
- from: #28461
