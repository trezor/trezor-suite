---
name: conveyor-2-plan-review
description: Review a feature-plan GitHub issue through multiple independent lenses (scope, architecture, and conditionally design and DX), auto-resolve mechanical decisions, surface only genuine taste decisions and user-challenges, consolidate the plan, and promote it from conveyor/plan:draft toward conveyor/plan:ready-to-implement. Runs interactively (human at keyboard) or autonomously (overnight routine, parks decisions). Use when asked to "review a plan", "advance a plan issue", or "drain plan decisions".
---

# conveyor-2-plan-review

Take a feature-plan issue and move it toward `conveyor/plan:ready-to-implement` while
spending as little human attention as possible. This is the second step of the
[planning workflow](../README.md); read that README for the data model and
lifecycle before running.

Core idea: **agents do the full analysis; only genuine judgement calls reach a
human, batched.** Everything else is auto-decided and logged.

## Inputs

- **Target issue.** Either a passed issue number, or — if none given — pick the
  highest-priority issue from the queue:
  `conveyor/plan:needs-human` first (a human is needed to drain it), then `conveyor/plan:draft`.
- **Mode.**
  - **Interactive** (default): a human is at the keyboard; resolve decisions live.
  - **Autonomous**: triggered by a routine / overnight run; never block on a
    human — park decisions and exit. Treat the run as autonomous if invoked with
    an autonomous/routine flag or if no interactive human is available.

## Process

### 0. Claim / load state

**Reconcile first (step-0).** Look at the issue's `conveyor/plan:*` labels. If it has zero
of them (orphan) or more than one, fix that before proceeding — drop the stale
ones so it carries exactly the one lifecycle label it should. **Also cross-check
that single label against the status comment's `State:` line.** If they disagree, a
previous run was interrupted between writing the comment and swapping the label —
re-derive the true state from the comment (unresolved open decisions →
`conveyor/plan:needs-human`; all clean with the acceptance-criteria gate passing →
`conveyor/plan:ready-to-implement`; an inconclusive in-review run → treat as a
stale lock and take over) and align both the label (add-before-remove) and the
`State:` line. Only then claim.

Fetch the issue body (the plan), the status comment, and the thread; **remember a
hash of the body and the label set as you loaded them** — you will re-check before
any write. If the status comment is missing, recreate it from the template in
`conveyor-1-plan-create`. Claim by **adding** `conveyor/plan:in-review` **before** removing the
prior lifecycle label, so a crash mid-transition leaves an extra findable label,
never zero.

`conveyor/plan:in-review` is a real (advisory) lock: if the issue is already
`conveyor/plan:in-review` and it was set recently (a fresh claim, not a stale crash),
**refuse** — another run holds it; do not race it. The label is advisory only —
two agents can race the read-then-write with no compare-and-swap — so never treat
it as a hard mutex; if in doubt about freshness, prefer to back off.

**Re-fetch before any exit write.** Before writing labels or body on exit, re-read
the issue and compare against the body hash / label set you loaded. If either
changed since you loaded it — a human or another run edited it — **abort the
write** and reconcile; never blindly "restore on exit" a remembered label, which
would clobber a concurrent edit.

If the issue is already `conveyor/plan:needs-human`, you are **draining**: skip new lens
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
  conveyor/plan: the goal is a complete feature; splitting a large change into shippable
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
it can reach `conveyor/plan:ready-to-implement`. If it is missing or empty, that is an open
decision for the human (numbered options: draft criteria for approval, or send
back) — it blocks promotion just like a P1.

**Noise gating** — what to surface at all:
- Surface findings at confidence ≥ 6/10.
- Always surface P1 (blocks implementation), regardless of confidence.
- Suppress P3 below confidence 7. State what was examined even when a lens found
  nothing — no silent skips.
- **A P1 always blocks promotion**, even one classified as **mechanical** and
  auto-resolved: the noise/classification gate decides who fixes it, not whether
  it blocks. An auto-fixed P1 still holds the plan out of `conveyor/plan:ready-to-implement`
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

Open decisions are surfaced as **GitHub task-list checkboxes** in the status
comment, so a human can answer **asynchronously by ticking boxes in the GitHub web
UI** — no agent has to be running, and they can do it from a phone. The format
(see step 4) is one checkbox per option per decision, plus a single
`- [ ] ✅ Done — agent, pick this up` box that signals the answers are final.

**Always read the existing status comment before you ask the human anything.** If a
prior run already parked these decisions and the human has since ticked the
`✅ Done` box, this is a **drain** — resolve from the ticked boxes (below) and do
**not** re-present the decisions or ask for an answer in chat. Re-asking for an
answer the human has already ticked in GitHub is a bug.

First, **post each lens's raw findings as its own thread comment** (the durable
log), and **rewrite the status comment** so its checkboxes, "Review lenses" table,
and "Resolved decisions" reflect this run. Before any **wholesale body rewrite**,
compare the current body against the hash you loaded in step 0 — if it changed, a
human edited it concurrently; reconcile onto the new body rather than clobbering
their edit. On every label transition below, **add the new label before removing
`conveyor/plan:in-review`** (a crash mid-flip leaves an extra findable label, never zero).

#### Drain run (entered at `conveyor/plan:needs-human`)
The human has been ticking boxes since the last run. Resolve from the ticked state:
- **Done box not ticked** → the human is not finished. Re-validate the parked
  options against the current body (drop/rewrite stale ones), report "still
  waiting on the human", and exit without promoting.
- **Done box ticked** → read each decision's boxes:
  - **exactly one option ticked** → that is the choice; apply it.
  - **no option ticked** → apply that decision's `✅ recommended` option and note
    "no box ticked — applied recommended" in Resolved.
  - **more than one ticked** → ambiguous; re-surface just that decision (clear its
    ticks, untick Done) and do **not** promote until it is resolved.

#### Interactive
Write all open decisions as the checkbox batch in the status comment (so they stay
answerable async too) **and** present them live to the human. They can either
answer now (tell you the option letters) or say they will tick the boxes in GitHub
later. If they answer now, tick the chosen boxes + the Done box yourself as the
record and resolve as in a drain run. If they defer, leave it parked **and tell
them the exact next step:** *tick the boxes + the `✅ Done` box in the status
comment, then re-run `/conveyor-2-plan-review`* — that drain reads the ticks,
consolidates the plan, and promotes it to `ready-to-implement`. (Not
`/conveyor-3-implement` — that only runs once the plan is `ready-to-implement`.)

#### Autonomous
Do **not** block. Write every open decision as the checkbox batch (options +
`✅ recommended` + an unticked Done box) into the status comment, apply all
mechanical resolutions to the body as usual, add `conveyor/plan:needs-human` then
remove `conveyor/plan:in-review`, and exit with a summary of what was parked. A
human ticks the boxes later; the next drain run picks it up.

**After resolving (any mode):** record each resolved decision under "Resolved
decisions" (what, which option, who/what decided, why) and **reconsolidate the
issue body** so it always reflects the latest plan. Then:
- If no open decisions remain, no lens left a P1 (including an auto-resolved one),
  and the acceptance-criteria gate passes → add `conveyor/plan:ready-to-implement`
  then remove `conveyor/plan:in-review`, update the status comment state, report done.
- Otherwise → keep `conveyor/plan:needs-human` and report what is still parked.

### 4. Status comment shape

Keep the status comment as the single dashboard. After a run it should look like:

```markdown
## 🤖 Plan review status

**State:** in-review | needs-human | ready-to-implement

### Open decisions (need a human)
_Tick one box per decision (no tick = the ✅ recommended option), then tick Done. You can do this in the GitHub web UI — no agent needed._

**1. <title>** — [taste]
- [ ] (a) <X> — <trade-off> ✅ recommended
- [ ] (b) <Y> — <trade-off>

**2. <title>** — ⚠️ user-challenge · changes stated scope · blocks promotion
- [ ] (a) keep as planned
- [ ] (b) <change> — <why> ✅ recommended

- [ ] ✅ **Done — agent, pick this up**

### Resolved decisions
- <title> — <decision> (mechanical / decided by <name>) — <why>

### Review lenses
| Lens | Status | Findings |
| --- | --- | --- |
| Scope / product | clean / N open | <summary> |
| Architecture | clean / N open | <summary> |
| Design | n/a / clean / N open | <summary> |
| DX | n/a / clean / N open | <summary> |

_Last updated by: conveyor-2-plan-review (<interactive|autonomous>)_
```

## Rules

- **English only on GitHub.** Everything you write to GitHub — the consolidated
  issue body, status comment, lens thread comments — is in English, even when the
  developer chats with you in another language.
- Always do the full analysis, even in autonomous mode. Mode changes only where
  the gate ends up (terminal vs. GitHub), never the depth.
- Batch human interaction. Never one question per turn.
- Every decision you surface is a **checkbox list** of options + a recommendation,
  with one `✅ Done` box — the human ticks a box (async, in the GitHub UI), never
  invents the answer. The Done box is the signal that the answers are final; a
  drain run resolves from the ticked state.
- The issue body is the single source of truth — reconsolidate it after every
  resolution.
- Read real code for the architecture lens; no speculative findings.
- Do not promote to `conveyor/plan:ready-to-implement` while any P1 (even an auto-resolved
  one), any unresolved open decision, or a missing/empty acceptance-criteria
  section remains.
- Never classify a signing/key/persistence/privacy edit as mechanical; always
  surface security/privacy findings regardless of confidence.
- Re-fetch the issue and compare against the body hash / labels you loaded before
  any label or body write; abort and reconcile if it changed — never blindly
  restore a remembered label.
- Add the new lifecycle label before removing the old one on every transition.
- Lenses run with fresh, independent context — do not let them share findings.
