---
name: conveyor-review
description: Run the agentic review station on a green draft PR (label review:queued). Request GitHub Copilot's review, run a triage-scaled adversarial second-opinion review in parallel, then process all findings — auto-fixing high-confidence low-risk ones and parking the rest for a human. Leaves a clean draft PR for a human to promote to "Ready for review". Runs interactively or autonomously (overnight routine). Use when asked to "review a PR", "run agentic review", or "process Copilot findings".
---

# conveyor-review

The agentic review station of the [workflow](../README.md): take a green draft PR
that `conveyor-implement` handed off (`review:queued`) and get it review-clean while
it is still a draft, so the only thing left is a human's final look.

This skill never promotes the PR to "Ready for review" — that is strictly a
human's signal (they verify the state, flip the draft, and find a second human to
do the final review). Your job is to make that human's job small.

## Where the data lives (PR, not issue)

Once a PR is open the linked issue is the **frozen spec** — read-only. All review
working state lives on the **PR**, mirroring the issue model one station back:

| Slot | Role |
| --- | --- |
| **PR description** | summary of the approach + `Closes #<issue>` (link to the spec) |
| **Review status comment** (yours, maintained) | dashboard: triage (diff size / risk), which reviews ran (Copilot, adversarial), open findings needing a human, resolved findings (what was fixed + commit SHA) |
| **Inline review comments** | the granular findings — Copilot's native ones plus your adversarial ones. Resolving a thread is two steps: reply with the fixing commit SHA (a REST reply does **not** resolve), then call the GraphQL `resolveReviewThread` mutation |
| **PR labels** | `review:*` lifecycle (below) |

## When to use

- A PR is labeled `review:queued` and is not `review:in-progress` /
  `review:needs-human`.

## Inputs

- **Target PR.** A passed PR number, or the oldest `review:queued` PR otherwise.
- **Mode.** Interactive (human at keyboard) or autonomous (routine; never blocks).

## Process

### 0. Claim

**Reconcile first (step-0).** Look at the PR's `review:*` labels. If it has zero
of them (orphan) or more than one, fix that before proceeding — drop the stale
ones so it carries exactly the one lifecycle label it should. Only then claim.

Claim by **adding** `review:in-progress` (the advisory review lock) **before**
removing `review:queued`, so a crash mid-transition leaves an extra findable
label, never zero. The label is advisory only — two agents can race the
read-then-write — so the real guard is the branch on origin plus
`--force-with-lease` (see §6). If the status comment does not exist yet, create it
from the template below; if one already exists (re-run), reuse it.

### 1. Triage the diff

- **Size & risk.** Measure size (files and lines changed) and risk (does it touch
  sensitive areas — signing paths, transport, crypto, persistence?). This sets
  review depth.
- **Splittability.** Does the PR bundle several independent concerns that could
  ship on their own? Note them — this feeds the split gate next.

### 2. Split feasibility — split a giant before reviewing it

A PR that is too large, or that bundles several independent concerns, is hard to
review well and risky to ship. Decide this **before** spending a deep review on
it (reviewing a PR you are about to chop up is wasted work).

- **Starting bar to bikeshed (tune it):** consider a split only when the diff is
  big **and** genuinely separable — e.g. > ~800 changed lines **OR** > 15 files,
  **AND** ≥ 2 independent concerns that share no symbols (no cross-references
  between the slices). If it is one large but cohesive concern, do not propose a
  split. When the bar is met, produce a concrete **split proposal**: the slices,
  what each delivers, and their dependency order.
- **Never auto-split.** Splitting restructures already-built work, so it is a
  user-challenge. Surface the proposal to a human: write it into the status
  comment and set `review:needs-human`. In autonomous mode, park and exit.
- **On approval, each slice re-enters the line at the start** — lift the slice off
  the belt and set it back at the beginning as its own `conveyor-plan-create`
  issue; this PR is then closed or reduced to the first slice. (How the branch is
  mechanically carved into slices is an open question — see the README.)
- **Record a declined split so it is not re-proposed.** If the human declines (or
  the bar is not met), mark it with a `**Split:** declined` line in the status
  comment. On a later re-run, honour that marker and skip the split gate rather
  than re-proposing the same split every time. Continue.

### 3. Request GitHub Copilot's review

Now that this PR is actually going to be reviewed, request Copilot as a reviewer
(via the GitHub UI's "Request review" or the request-reviewers API — pin the
exact Copilot reviewer login for your org). Copilot delivers asynchronously,
usually within minutes, so kick this off and do other work while it runs.

### 4. Run your own adversarial review (in parallel with Copilot)

While Copilot runs, do not idle. Run an adversarial second-opinion review, scaled
to the triage:

- small / low-risk → one reviewer subagent.
- medium → a couple, split by concern.
- large / sensitive → fan out several reviewers per package/area, plus a
  dedicated security pass (hardware wallet — take signing and key handling
  seriously).

Each reviewer is prompted to **find real bugs and try to break the code**, not to
nitpick style (lint/format is CI's job). Post findings as inline comments.

**Always-on spec-fidelity reviewer (every triage size).** Independent of the
bug-hunters, run one reviewer whose only job is to read the **frozen spec** (the
linked issue — its `## Acceptance criteria / Definition of done` in particular)
and the diff side by side, and flag **drift**: acceptance criteria with no
implementation, scope that was silently dropped or added, behaviour that
contradicts the spec, and — critically — whether the new e2e/integration test
actually exercises the new feature (the existing suite passing is not proof).
This reviewer hunts *unimplemented scope*, not existing-code bugs, so it runs even
on a tiny diff.

### 5. Collect Copilot's findings

Once Copilot's review lands, pull its review and inline comments and merge them
with your adversarial findings into one set.

### 6. Process the findings

Gate for noise, then classify each finding by who resolves it (same model as
`conveyor-plan-review`):

- **Noise gate.** Consider findings at confidence ≥ 6/10; always consider
  anything that looks like a real bug or a security issue regardless of
  confidence. Drop pure style nits.
- **Auto-fix** — only when **all** hold: confidence is high (≥ 8/10), the fix is
  clear and mechanical, it is low-risk, and it does not change intended behaviour
  or the spec. Never classify a signing / key-handling / persistence / privacy
  finding as mechanical — those always route to a human (park). Apply it, commit
  (conventional commit; for a bug in a specific earlier commit prefer `--fixup`).
  Before pushing: `git fetch origin <branch>`; if it advanced with a commit you
  did NOT author, STOP (a human or a repo bot pushed — never clobber it) and
  reconcile. Otherwise `git push --force-with-lease`; a non-fast-forward / lease
  rejection means you LOST the lock — stop and reconcile, do not retry the push.
  Then **resolve the thread in two steps**: replying via REST does NOT resolve a
  thread — first post a reply with the fixing commit SHA, then call the GraphQL
  `resolveReviewThread` mutation on that thread. Log it under "Resolved" in the
  status comment.
- **Park** — everything else: taste calls, uncertain findings, risky fixes,
  anything that would change behaviour or contradict the spec, plus every
  security/privacy finding regardless of confidence. Write it into the status
  comment's "Open findings" as **numbered options** (e.g. (1) fix this way, (2)
  fix that way, (3) accept as-is) with your recommendation, so the human resolves
  it by picking a number. Never auto-apply.
- **After an auto-fix push, re-watch CI.** Poll `gh pr checks` (0 = all pass, 8 =
  some pending, 1 = some failed) and keep polling while anything is pending. If
  the fix breaks a check, only count a fix attempt against a check whose
  conclusion is actually `failure` — never against a pending/queued one, and never
  against an infra/transient failure (registry 5xx, emulator boot, runner OOM):
  those back off and retry the same commit. Honour the global run budget (default
  10 total fix attempts); on exhaustion, park as `review:needs-human`.

### 7. Maintain the status comment

Keep the review status comment current (template below). It is the human's
one-stop dashboard for "what did the agents find, what did they fix, what is left
for me".

**Locate it idempotently — there must be exactly one.** Find your status comment
by matching the `## 🤖 Review status` heading among the PR's comments. If zero
match, create it; if exactly one matches, edit that one in place; if more than one
matches (a crashed re-run double-posted), reconcile by keeping the newest and
deleting the rest. Never blindly post a new comment.

### 8. Freshness check (before any clean hand-off)

A long review can leave the branch stale or red against `develop`. Before handing
off `review:passed`, check the branch against `origin/develop`
(`git rev-list --count origin/develop ^<branch>` for how far behind). The
`review:in-progress` label is the lock you hold through this.

- If it is **> 20 commits behind**, rebase onto `develop`, run a **local
  type-check before pushing**, then `git fetch origin <branch>` and (if it did not
  advance with a commit you did not author) `git push --force-with-lease`. A
  lease rejection means you lost the lock — stop and reconcile, do not retry.
- If the rebase surfaces non-trivial conflicts or the post-rebase build/tests go
  red, **bounce it back to implementation** (`impl:in-progress` for that station to
  pick up) rather than hand off a broken PR — note why in the status comment.
- Only a green, reasonably-fresh branch proceeds to the clean hand-off.

### 9. Hand off

Always **add** the new label **before** removing `review:in-progress`, so a crash
mid-transition leaves an extra findable label, never zero.

- **Clean** (nothing parked, no unresolved real/security finding, branch fresh):
  add `review:passed`, then remove `review:in-progress`. Comment a summary. The PR
  stays a **draft** — a human now verifies and promotes it to "Ready for review".
- **Parked** (open findings remain): add `review:needs-human`, then remove
  `review:in-progress`. `review:needs-human` is hands-off for other agents until a
  human resolves the open findings (then re-run `conveyor-review` to continue).

**Stale-takeover of a crashed review.** `review:in-progress` is advisory, so a
crashed run can leave a PR stuck under it with no agent working. If a PR carries
`review:in-progress` but its branch has had no new commit and the status comment
no update for a stale interval, treat the lock as abandoned: reconcile (step-0)
and take it over — never leave it a silent dead PR.

## Status comment template

```markdown
## 🤖 Review status

**State:** in-progress | needs-human | passed
**Triage:** <N files, ~M lines> — risk: low | medium | high (<sensitive areas>)
**Split:** not needed | proposed (see below) — <n slices> | declined (do not re-propose)

### Split proposal (if any)
1. **<slice>** — <what it delivers> — depends on: <…>

### Open findings (need a human)
1. **<title>** — <file:line> — options: (a) <…> ✅ recommended; (b) <…>; (c) accept as-is. [taste | risky | changes-spec]
_(pick the option letter)_

### Resolved
- <title> — <file:line> — fixed in <sha> (<source: copilot | adversarial>)

### Reviews run
| Review | Status | Findings |
| --- | --- | --- |
| Copilot | requested / delivered | <n> |
| Adversarial | <n reviewers> | <n> |
| Spec-fidelity | done | <n drift items> |

_Last updated by: conveyor-review (<interactive|autonomous>)_
```

## Modes

- **Interactive**: request Copilot, run adversarial review, process findings live,
  hand off.
- **Autonomous** (routine): same core, but poll for Copilot's review between wakes
  instead of blocking; on clean set `review:passed`, on parked set
  `review:needs-human`. The mode for burning pooled tokens overnight.

## Rules

- Never promote the PR to "Ready for review" — that is the human's signal.
- Check splittability before the deep review; never auto-split — a split is a
  user-challenge, so propose it and let a human approve. Use a concrete bar
  (> ~800 lines OR > 15 files AND ≥ 2 independent symbol-disjoint concerns) and
  record a declined split so it is never re-proposed.
- Every parked finding (and the split proposal) is presented as numbered options
  with a recommendation — the human picks one, never invents the answer.
- The issue is frozen once the PR exists; write everything to the PR.
- Auto-fix only high-confidence, low-risk, behaviour-preserving findings; park
  everything else. Never treat a signing / key-handling / persistence / privacy
  finding as mechanical, and always surface security/privacy findings regardless
  of confidence.
- Adversarial reviewers hunt bugs and breakage, not style — leave lint/format to
  CI. Always run the spec-fidelity reviewer too (frozen spec vs diff), at every
  triage size, to catch unimplemented scope / drift.
- Scale review depth to the triage; never run a single light pass over a large or
  signing-sensitive diff.
- The label is advisory; the branch is the real lock. Always `git fetch origin
  <branch>` before any push and STOP if it advanced with a commit you did not
  author; push with `--force-with-lease`; a lease rejection means you lost the
  lock — reconcile, do not retry.
- Add the new lifecycle label before removing the old one on every transition.
- Respect `review:in-progress` / `review:needs-human` on other PRs, but treat an
  `review:in-progress` whose branch and status comment have gone stale as an
  abandoned lock to reconcile and take over.
