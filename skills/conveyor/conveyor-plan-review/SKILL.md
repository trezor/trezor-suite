---
name: conveyor-plan-review
description: Review a feature-plan GitHub issue through multiple independent lenses (scope, architecture, and conditionally design and DX), auto-resolve mechanical decisions, surface only genuine taste decisions and user-challenges, consolidate the plan, and promote it from plan:draft toward plan:ready-to-implement. Runs interactively (human at keyboard) or autonomously (overnight routine, parks decisions). Use when asked to "review a plan", "advance a plan issue", or "drain plan decisions".
---

# conveyor-plan-review

Take a feature-plan issue and move it toward `plan:ready-to-implement` while
spending as little human attention as possible. This is the second step of the
[planning workflow](../README.md); read that README for the data model and
lifecycle before running.

Core idea: **agents do the full analysis; only genuine judgement calls reach a
human, batched.** Everything else is auto-decided and logged.

## Inputs

- **Target issue.** Either a passed issue number, or — if none given — pick the
  highest-priority issue from the queue:
  `plan:needs-human` first (a human is needed to drain it), then `plan:draft`.
- **Mode.**
  - **Interactive** (default): a human is at the keyboard; resolve decisions live.
  - **Autonomous**: triggered by a routine / overnight run; never block on a
    human — park decisions and exit. Treat the run as autonomous if invoked with
    an autonomous/routine flag or if no interactive human is available.

## Process

### 0. Claim / load state

**Reconcile first (step-0).** Look at the issue's `plan:*` labels. If it has zero
of them (orphan) or more than one, fix that before proceeding — drop the stale
ones so it carries exactly the one lifecycle label it should. Only then claim.

Fetch the issue body (the plan), the status comment, and the thread; **remember a
hash of the body and the label set as you loaded them** — you will re-check before
any write. If the status comment is missing, recreate it from the template in
`conveyor-plan-create`. Claim by **adding** `plan:in-review` **before** removing the
prior lifecycle label, so a crash mid-transition leaves an extra findable label,
never zero.

`plan:in-review` is a real (advisory) lock: if the issue is already
`plan:in-review` and it was set recently (a fresh claim, not a stale crash),
**refuse** — another run holds it; do not race it. The label is advisory only —
two agents can race the read-then-write with no compare-and-swap — so never treat
it as a hard mutex; if in doubt about freshness, prefer to back off.

**Re-fetch before any exit write.** Before writing labels or body on exit, re-read
the issue and compare against the body hash / label set you loaded. If either
changed since you loaded it — a human or another run edited it — **abort the
write** and reconcile; never blindly "restore on exit" a remembered label, which
would clobber a concurrent edit.

If the issue is already `plan:needs-human`, you are **draining**: skip new lens
analysis unless the plan changed since the parked decisions were written, and go
straight to the gate (step 3) with the parked decisions (re-validate them against
the current body first — see step 3).

### 1. Run the review lenses

Run each applicable lens as an **independent subagent with fresh eyes** (no
shared context between lenses — divergence between them is signal). Run them in
parallel.

Always run:

- **Scope / product lens.** Is this the right problem, solving a real, evidenced
  need? Is the feature **complete** — anything missing that the feature needs to
  work properly? Are the stated non-goals genuinely out of this feature (not just
  deferred work that is actually load-bearing)? Do **not** push to shrink the
  plan: the goal is a complete feature; splitting a large change into shippable
  pieces is the review station's job, not the plan's.
- **Architecture lens.** Does the approach fit the codebase? Coupling, shared
  code blast radius, data flow, failure modes, security/privacy/signing
  implications (hardware wallet — take this seriously), test surface, backward
  compatibility. Read the actual code for the affected areas; do not theorize.

Run conditionally (detect from the plan's "Affected areas" / "Scope"):

- **Design lens** — only if the plan has UI scope (components, screens, flows).
  Information architecture, interaction states, accessibility, consistency.
- **DX lens** — only if the plan changes a developer-facing surface (a
  `connect` API, an exported package API, a CLI). API ergonomics, docs, migration.

Each lens returns findings in this shape:

```
[SEVERITY P1|P2|P3] (confidence N/10) area — finding
  → recommendation
  → decision type: mechanical | taste | user-challenge
```

### 2. Gate the findings into decisions

Apply noise gating, then classify:

**Acceptance-criteria gate.** The plan body must carry a non-empty
`## Acceptance criteria / Definition of done` section (testable criteria) before
it can reach `plan:ready-to-implement`. If it is missing or empty, that is an open
decision for the human (numbered options: draft criteria for approval, or send
back) — it blocks promotion just like a P1.

**Noise gating** — what to surface at all:
- Surface findings at confidence ≥ 6/10.
- Always surface P1 (blocks implementation), regardless of confidence.
- Suppress P3 below confidence 7. State what was examined even when a lens found
  nothing — no silent skips.
- **A P1 always blocks promotion**, even one classified as **mechanical** and
  auto-resolved: the noise/classification gate decides who fixes it, not whether
  it blocks. An auto-fixed P1 still holds the plan out of `plan:ready-to-implement`
  until the human confirms (it stays a tracked blocker, not silently cleared).

**Classification** — who decides:
- **Mechanical** (one clearly-right answer, no real alternatives): auto-resolve.
  Apply the fix to the plan body, log it under "Resolved decisions". Do not ask.
- **Taste** (reasonable people disagree — close approaches, borderline scope of a
  few files, lens disagreement with valid reasoning): pick the better option per
  the principles below, but surface it as an open decision the human can override.
- **User-challenge** (the analysis concludes the developer's *stated* direction
  should change — drop a scoped feature, merge two things they wanted separate,
  add something they did not ask for): never auto-decide. Always surface.

**Security carve-out.** Never classify a signing, key-handling, persistence, or
privacy plan edit as **mechanical** — route it to taste or user-challenge so a
human decides. Always surface security/privacy findings regardless of confidence
(they bypass the noise gate, like P1).

Principles for auto-deciding taste calls (and for your recommendation):
1. Prefer the complete option over the shortcut — agent time is cheap, the cost
   delta is negligible.
2. Reuse what exists; reject plans that duplicate existing code.
3. Explicit and obvious over clever and abstract.
4. Bias toward unblocking — flag concerns, do not invent blockers.

### 3. The decision gate (mode-dependent)

**On a drain run** (entered at `plan:needs-human`): re-read the body, the status
comment, and the thread, and **re-validate every parked option against the
current body** — a human may have edited the plan since the options were written,
making some moot or wrong. Drop or rewrite stale options before presenting them.

First, **post each lens's raw findings as its own thread comment** (the durable
log), and **rewrite the status comment** so its "Review lenses" table and
"Resolved decisions" reflect this run. Before any **wholesale body rewrite**,
compare the current body against the hash you loaded in step 0 — if it changed, a
human edited it concurrently; reconcile (re-apply your resolutions onto the new
body) rather than overwriting and clobbering their edit.

Then branch on mode:

#### Interactive
Present **all open decisions (taste + user-challenge) as one batch** — do not
drip them one per turn. For each decision give the human **the concrete options
you weighed as a numbered list**, each with its trade-off, plus your recommended
option — so the human can answer by **picking a number**, not by inventing an
answer. Mark user-challenges clearly as "changes what you asked for". The human
responds once.

For each resolved decision:
- Record it under "Resolved decisions" in the status comment (what, who decided,
  why).
- **Reconsolidate the issue body** so it reflects the decision — the body must
  always be the latest plan.

On every transition below, **add the new lifecycle label before removing
`plan:in-review`**, so a crash mid-flip leaves an extra findable label, never
zero.

Then:
- If no open decisions remain, no lens left a P1 (including an auto-resolved one),
  and the acceptance-criteria gate passes → add `plan:ready-to-implement` then
  remove `plan:in-review`, update the status comment state, report done.
- If decisions remain unresolved (human deferred some) → add `plan:needs-human`
  then remove `plan:in-review`, leave them in "Open decisions", report what is
  parked.

#### Autonomous
Do **not** block. Write every open decision into the status comment's "Open
decisions (need a human)" section as **numbered options with your recommendation**
and each option's trade-off, so the human can later resolve it by picking a number
rather than designing an answer. Apply all mechanical resolutions to the body as
usual. Add `plan:needs-human` then remove `plan:in-review`. Exit with a summary of
what was parked.

### 4. Status comment shape

Keep the status comment as the single dashboard. After a run it should look like:

```markdown
## 🤖 Plan review status

**State:** in-review | needs-human | ready-to-implement

### Open decisions (need a human)
1. **<title>** — options: (a) <X> ✅ recommended — <trade-off>; (b) <Y> — <trade-off>. [taste]
2. **<title>** — ⚠️ changes stated scope. options: (a) keep as planned; (b) <change> ✅ — <why>. [user-challenge]
_(pick the option letter)_

### Resolved decisions
- <title> — <decision> (mechanical / decided by <name>) — <why>

### Review lenses
| Lens | Status | Findings |
| --- | --- | --- |
| Scope / product | clean / N open | <summary> |
| Architecture | clean / N open | <summary> |
| Design | n/a / clean / N open | <summary> |
| DX | n/a / clean / N open | <summary> |

_Last updated by: conveyor-plan-review (<interactive|autonomous>)_
```

## Rules

- Always do the full analysis, even in autonomous mode. Mode changes only where
  the gate ends up (terminal vs. GitHub), never the depth.
- Batch human interaction. Never one question per turn.
- Every decision you surface comes with numbered options + a recommendation — the
  human picks one, never invents the answer.
- The issue body is the single source of truth — reconsolidate it after every
  resolution.
- Read real code for the architecture lens; no speculative findings.
- Do not promote to `plan:ready-to-implement` while any P1 (even an auto-resolved
  one), any unresolved open decision, or a missing/empty acceptance-criteria
  section remains.
- Never classify a signing/key/persistence/privacy edit as mechanical; always
  surface security/privacy findings regardless of confidence.
- Re-fetch the issue and compare against the body hash / labels you loaded before
  any label or body write; abort and reconcile if it changed — never blindly
  restore a remembered label.
- Add the new lifecycle label before removing the old one on every transition.
- Lenses run with fresh, independent context — do not let them share findings.
