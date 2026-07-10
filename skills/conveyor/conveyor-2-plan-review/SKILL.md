---
name: conveyor-2-plan-review
description: Review a feature-plan GitHub issue through multiple independent lenses (scope, architecture, and conditionally design and DX), auto-resolve mechanical decisions, surface only genuine taste decisions and user-challenges, consolidate the plan, and promote it from conveyor/plan:draft toward conveyor/plan:ready-to-implement. Runs interactively (human at keyboard) or autonomously (overnight routine, parks decisions). Use when asked to "review a plan", "advance a plan issue", or "drain plan decisions".
---

# conveyor-2-plan-review

Take a feature-plan issue and move it toward `conveyor/plan:ready-to-implement` while
spending as little human attention as possible. This is the second step of the
[planning workflow](../README.md); read that README for the data model and
lifecycle, and the shared [conventions](../CONVENTIONS.md) for the house rules,
before running.

Core idea: **agents do the full analysis; only genuine judgement calls reach a
human, batched.** Everything else is auto-decided and logged.

## Inputs

- **Target issue.** Either a passed issue number, or — if none given — pick the
  highest-priority issue from the queue: `conveyor/plan:needs-human` first (a human is
  needed to drain it), then `conveyor/plan:draft`, then any **`conveyor/plan:in-review`
  whose claim is stale** (the status comment / issue has not been updated for a while =
  a previous run crashed mid-claim) — reconcile and take it over (step 0). A scan that
  only lists draft + needs-human leaves a crashed in-review lock stuck forever; sweep
  it.
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
  deferred work that is actually load-bearing)? **And cut the opposite — speculative
  scope:** gold-plating is a scope defect too (anti-regression guards for hypothetical
  future mistakes, defensive checks, "while we're here" extras the stated problem did
  not require). Flag those to **drop** — a taste decision *with a decline option* (see
  the gate), never praised as "completeness". Complete = every **load-bearing** part the
  feature needs, not every safeguard you can imagine. Do **not** push to shrink the
  conveyor/plan: the goal is a complete feature; splitting a large *cohesive* change
  into shippable pieces is the review station's job, not the plan's. **Check cohesion,
  though:** is this **one** feature, or several **independent** concerns bundled into
  one issue (separable deliverables that share no code and each ship on their own)?
  Don't shrink a cohesive feature — but a bundle is not a single plan; flag it for
  **decomposition** (the gate, step 2). Decompose on independence, never on raw size.
- **Architecture lens.** Does the approach fit the codebase? Coupling, shared
  code blast radius, data flow, failure modes, security/privacy/signing
  implications (hardware wallet — take this seriously), test surface, backward
  compatibility. Read the actual code for the affected areas; do not theorize, and
  **cite what you read as clickable permalinks** pinned to the base SHA you read
  (see CONVENTIONS "Cite code as a clickable permalink"), not bare `path:line` text.
  **Load project learnings** (`.github/conveyor-learnings.md`, see CONVENTIONS) for
  those areas and apply any that are relevant (annotate `Applied prior learning:`
  in the status comment).

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

**Always offer "don't do it" for additive scope.** When a decision is about *adding*
something optional — a safeguard, an anti-regression guard, an extra test beyond the
acceptance criteria, defensive scope the core ask did not require — the options **must**
include an explicit **decline** (e.g. `- [ ] (c) drop it — not worth the complexity`),
and when the addition is speculative, **recommend declining**. Never present an additive
proposal as a *how*-only choice ("unit test vs CI check") when *whether to add it at all*
is the real question — that railroads the human into scope they may not want. Litmus: if
the same reasoning ("someone might re-introduce X") would justify a guard for everything,
the guard is opt-in, not assumed.

**Decomposition gate — don't park a wall of checkboxes.** If gating would leave
**more than ~6 open decisions**, or the scope lens found the plan **bundles ≥2
independent concerns** (separable, share no code, each shippable alone), the plan is
**too broad to be one plan**. Do **not** park the long list. Surface a single
**decomposition user-challenge** instead: propose splitting it into N **named
sub-plans** — each a cohesive feature with its own scope + acceptance criteria — in
dependency order. Like the review station's split, it is **decline-by-default** —
options `- [ ] (a) keep as one plan ✅ recommended` / `- [ ] (b) approve decomposition
(sub-plans below)` — so a drain with **no box ticked is a no-op** (stays one plan); the
spin-off runs **only** on an explicit `approve` tick. Split on **independence**, not on
count alone (the >6 count is the tripwire to *look*, not the verdict): a cohesive
feature with many *small* decisions is not this case.

**Executing an approved decomposition is interactive-only — never unattended.**
Creating issues and closing the parent are structural actions, so in **autonomous** mode
(and any routine-driven drain) **park the proposal and exit**; even once `approve` is
ticked, a routine drain must **not** spin anything off — it notes "decomposition approved
— run `/conveyor-2-plan-review` interactively to execute" and stays parked. Only an
**interactive** run, on the `approve` tick, performs it: create each sub-plan as its own
`conveyor-1-plan-create` issue (carry the relevant decisions to each), then **close the
parent** — remove its `conveyor/plan:*` label and post a closing comment linking the N
sub-plans (closing is reversible). Do not invent a tracking/epic label.

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

First, **post all lens findings in a single "review lenses" thread comment** (the
durable log) — **never one comment per lens** (see CONVENTIONS "one comment, not
many"). Put each lens that ran in its own **collapsed** `<details>` block, so the
thread keeps one comment and the reader expands only the lens they want:

```markdown
## 🔍 Plan review lenses (this run)

<details><summary><b>Scope / product</b> — <one-line verdict></summary>

<raw findings>

</details>

<details><summary><b>Architecture</b> — <one-line verdict></summary>

<raw findings>

</details>
```

Then **rewrite the status comment** so its checkboxes, "Review lenses" table,
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
- **Decomposition exception.** An `approve decomposition` tick is executed **only by
  an interactive run** (it creates the sub-plan issues and closes the parent — see the
  gate). An **autonomous / routine** drain that finds it ticked must **not** execute:
  note "decomposition approved — run `/conveyor-2-plan-review` interactively to execute"
  and leave it parked.

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

**After resolving (any mode):** if the resolved decision was an **approved
decomposition** just executed (interactive only — see the gate), the parent issue is
now closed with its sub-plans linked — **stop here**, the steps below do not apply.
Otherwise: record each resolved decision under "Resolved decisions" (what, which
option, who/what decided, why), **reconsolidate the issue body** (including the
`## Team` block — keep it), and **assemble the team** (below). Then:
- If no open decisions remain, no lens left a P1 (including an auto-resolved one),
  and the acceptance-criteria gate passes → add `conveyor/plan:ready-to-implement`
  then remove `conveyor/plan:in-review`, update the status comment state, report done.
  (A reviewer does **not** block promotion — the required approval is enforced at the
  PR's human-review handoff; see the Reviewer note below.)
- Otherwise → keep `conveyor/plan:needs-human` and report what is still parked.

#### Assemble the team
The plan body carries a `## Team` block (seeded by `conveyor-1-plan-create` with the
**Product owner** = issue creator). Fill in the rest, scaled to the plan's size and
"Affected areas". Candidate sources, in order: the roster at `.github/conveyor-team.yml`
if present (maps people → roles `product|eng|review|qa` → areas); otherwise **CODEOWNERS**
— the repo's de-facto roster (the owners of the Affected areas, or the **nearest parent
path's** owners if an area is uncovered, always excluding the Product owner/author). Only
if neither yields a candidate do you ask the human.

- **Reviewer — non-blocking; the PR handoff is the real gate.** The required single
  approval is enforced at the PR by branch protection + CODEOWNERS, so a reviewer does
  **not** block plan promotion. Still propose one as a **fallback** (used by the belt's
  human-review handoff only when CODEOWNERS matches nothing): surface the candidate
  owners (from the source above) as **checkboxes**, plus a `- [ ] None now — a reviewer
  is requested at the PR` option (recommend this when CODEOWNERS already covers the
  Affected areas). **Report the coverage** so the human chooses informed — e.g.
  "CODEOWNERS covers `packages/connect` (auto-requests its owners) but **not**
  `packages/connect-data` — pin a fallback below". If CODEOWNERS yields no usable
  candidate at all, tell the human to **set the issue Assignee** to the intended
  reviewer (a native one-click action; the drain reads it from
  `gh issue view --json assignees`). Whoever is chosen goes into the `## Team` Reviewer
  line (without `@`); they are requested at the PR only if CODEOWNERS did not.
- **Eng owner — optional.** Propose one only when the change is **large or
  architecturally significant** (multi-package, new infra, signing/transport).
  They own the technical approach and are the human `conveyor-3-implement` pulls in
  when implementation parks to `conveyor/impl:needs-human`.
- **Tester — optional.** Propose one only when there is a **real test/QA surface**
  (user-facing flow, risky behaviour) — they own the future test/QA sign-off.

Surface eng/tester as async checkbox decisions ("add an eng owner? who?" / "add a
tester? who?") alongside the other decisions, with your recommendation. Write the
final names into the `## Team` block **without a leading `@`** (no notification);
each person is only actually requested/assigned at their own gate downstream.

### 4. Status comment shape

**Locate it idempotently — exactly one.** The dashboard is the `## 🤖 Plan review
status` comment, and **the plan-create placeholder IS that comment** — adopt and
**rewrite it in place**, never post a second. Find it by heading among the issue's
comments: exactly one → edit that one; zero → create from the template; more than one
(a crashed re-run, or a placeholder that a prior run failed to adopt) → keep the
newest and **delete the stale duplicates**. A duplicate stale `State: draft / none
yet / Last updated by: plan-create` placeholder sitting above the real dashboard is a
bug — never blindly post a new status comment.

Keep the status comment as the single dashboard. After a run it should look like:

```markdown
## 🤖 Plan review status

**State:** in-review | needs-human | ready-to-implement

### Open decisions (need a human)
_Tick one box per decision (no tick = the ✅ recommended option), then tick Done. You can do this in the GitHub web UI — no agent needed._

**1. <title>** — [taste]
- [ ] (a) <X> — <trade-off> ✅ recommended
- [ ] (b) <Y> — <trade-off>
- [ ] (c) drop it / don't add — *required option whenever the decision adds optional scope (a guard, an extra check); recommend this when the addition is speculative*

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

- Follow the shared [conventions](../CONVENTIONS.md) — **English only**, **no
  hard-wrapping**, **async checkboxes** (read ticks first, never re-ask),
  **add-before-remove + reconciliation / re-fetch before write**, the **security
  carve-out**, and **team handles without `@`** all apply here. Plus the rules
  specific to plan review:
- Always do the full analysis, even in autonomous mode. Mode changes only where
  the gate ends up (terminal vs. GitHub), never the depth.
- Batch human interaction. Never one question per turn.
- The issue body is the single source of truth — reconsolidate it after every
  resolution.
- Read real code for the architecture lens; no speculative findings.
- Do not promote to `conveyor/plan:ready-to-implement` while any P1 (even an auto-resolved
  one), any unresolved open decision, or a missing/empty acceptance-criteria section
  remains. A reviewer does **not** block promotion — it is a non-blocking fallback
  resolved at the PR's human-review handoff (CODEOWNERS-primary).
- The `## Team` block: Product owner = issue creator (kept as-is); propose a
  **non-blocking** reviewer fallback from CODEOWNERS (or the roster); eng owner +
  tester are optional, by size.
- Lenses run with fresh, independent context — do not let them share findings.
