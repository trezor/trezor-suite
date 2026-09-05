---
name: conveyor-5-land
description: Watch the base branch (develop) CI after a human merges a Conveyor PR, and confirm the merge did not break develop. A PR that was green can still break develop post-merge (rebase / interaction), and this repo has hit exactly that. Verify the post-merge commit, classify any new red against a pre-merge baseline, and on a real regression park the revert / forward-fix decision for the eng owner. Runs interactively or autonomously (overnight routine). Use when asked to "verify a merge", "watch develop after merge", or "drain land decisions".
---

# conveyor-5-land

The post-merge verification station of the [workflow](../README.md): a human has
flipped a `conveyor/review:passed` draft to ready, a second human reviewed it, and
**a human merged it** — now confirm that merge did not break `develop`. Follow the
shared [conventions](../CONVENTIONS.md) for the house rules.

**The merge is always a human action — this station never merges.** A green PR can
still break `develop` after it lands: the merge rebases the diff onto a `develop`
that moved, and an interaction the PR's own CI never saw can turn it red. This repo
has hit exactly that — red tests can merge, and a silent rebase can break
type-check that was green on the PR. This station closes that gap: watch the
post-merge `develop` run, and if the merge broke the base, surface the
revert / forward-fix decision to the eng owner. That is its whole job.

## When to use

- A fresh verify: a **recently merged** PR that carried the agentic-review / human-review
  trail (`conveyor/human:needs-approval` — or `conveyor/review:passed` for a PR merged
  without the human-handoff step) and has **no** `conveyor/land:*` label yet. Find them
  with `gh pr list --state merged --label conveyor/human:needs-approval` and
  `gh pr list --state merged --label conveyor/review:passed`, or pass a merged PR number.
- A **drain run**: a PR labeled `conveyor/land:needs-human` where the human has
  ticked the answer checkboxes (see step 4) — re-run to read their choice (revert /
  forward-fix / flake) and act.

## Inputs

- **Target PR.** A merged PR number; otherwise the oldest merged PR carrying
  `conveyor/human:needs-approval` (or `conveyor/review:passed`) with no
  `conveyor/land:*` label, then the oldest `conveyor/land:needs-human` PR whose
  `✅ Done` box is ticked.
- **Mode.** Interactive (human at keyboard; watch the `develop` run live) or
  autonomous (routine; poll between wakes, never block, park to
  `conveyor/land:needs-human` when a regression needs a human).

## Process

### 0. Claim

**Reconcile first (step-0, per [conventions](../CONVENTIONS.md)).** Look at the
PR's `conveyor/land:*` labels and cross-check the single label against the status
comment's `State:` line. If it carries zero `conveyor/land:*` (fresh) that is
normal — proceed. If it carries more than one, or a label that disagrees with the
status comment (a run interrupted mid-handoff), re-derive the true state from the
comment and align both before claiming.

Claim by **adding** `conveyor/land:watching` (the advisory watch lock) — on a fresh
run there is no prior `conveyor/land:*` to remove (the PR is merged; the
`conveyor/review:passed` label stays as the trail of where it came from); on a
drain run, add-before-remove against `conveyor/land:needs-human`. If the status
comment does not exist yet, create it from the template below; if one already
exists (re-run), reuse it. Re-read immediately after adding the label; if a second
`conveyor/land:watching` appeared, another agent raced you — back off and reconcile
to one owner.

**Drain run (entered at `conveyor/land:needs-human`).** Skip the watch and resolve
from the ticked state exactly as in step 4 ("Resolve from ticked boxes"). If the
`✅ Done` box is not ticked, the human is not finished — report "still waiting" and
exit without changing the label.

### 1. Find the merge commit

Get the merge commit this PR produced on `develop`:
`gh pr view <pr> --json mergeCommit,mergedAt,baseRefName,baseRefOid`. The
`mergeCommit.oid` is the SHA whose CI you verify; `baseRefOid` (the base the PR was
merged onto) is the **pre-merge base** you baseline against in step 3. If
`mergeCommit` is null the PR is not actually merged — stop (nothing to verify).

### 2. Watch the post-merge `develop` run

Watch the `develop` CI run **for that merge SHA** until it concludes. List runs on
the base branch and pick the one whose head SHA is the merge commit:
`gh run list --branch develop --json databaseId,headSha,status,conclusion`. Poll by
exit code (per [conventions](../CONVENTIONS.md), as in `conveyor-3-implement`):
`0` = all pass, `8` = some pending, `1` = some failed. **Keep polling while
anything is pending (8)** — the full `develop` / nightly suite is slower than the
per-PR run. In interactive mode you may `--watch`; in autonomous mode poll between
wakes and never block. If no run has been triggered for the merge SHA yet, keep
waiting — the run may not have been scheduled at the instant of merge.

### 3. Classify against a pre-merge baseline

A red check on `develop` is only **this PR's** regression if it was **green before
this merge and is now red, and stays red across a rerun**. Bucket each failing
check:

- **Broken in `develop` already** → the same check was failing on the pre-merge
  base (`baseRefOid` from step 1 — read that commit's `develop` run, do not run it
  locally; for e2e / dev-env the only reliable baseline is the prior CI run). A
  gate already red before this merge is **not** this PR's regression — reuse the
  broken-in-develop bucket, note it, and stop chasing it.
- **Flake** → red on the merge SHA but green on rerun. **Rerun the failed jobs
  once** (`gh run rerun <id> --failed`) and re-check; a check that goes green on
  rerun was a single flake, not a regression. Persistence, not a single red, is
  what counts.
- **Broken by this merge** → green on the pre-merge base, red on the merge SHA, and
  **still red after the rerun** (persistent). This is the regression this station
  exists to catch — even though the PR's own CI was green, the rebase / interaction
  with the moved `develop` broke the base.
- **Infra / transient** (registry 5xx, emulator boot, runner OOM, network) → not a
  regression; back off and re-check the same SHA, do not park it as broken.

### 4. Outcome

Add-before-remove on every transition (per [conventions](../CONVENTIONS.md)).

- **All green** (minus the pre-existing broken-in-develop bucket): the merge is
  clean. Add `conveyor/land:verified`, then remove `conveyor/land:watching`. Comment
  a one-line confirmation (merge SHA + the `develop` run it passed). Done — the
  feature is landed and the base is healthy.
- **Broke `develop`**: a check was green on the base and is **persistently** red on
  the merge commit. Add `conveyor/land:broke-develop`, then remove
  `conveyor/land:watching`. **Pull in the eng owner — this is their gate:**
  `@`-mention the **eng owner from the PR's `## Team` block** in the diagnosis
  comment (the notification here is intended — the base is broken and needs them; if
  there is no eng owner, fall back to the Product owner). **Park the decision** as a
  checkbox list under a `✅ Done` box in the status comment:
  - `- [ ] (a) revert the merge ✅ recommended` — only when it reverts cleanly
    (`git revert -m 1 <merge-sha>` applies with no conflict); restores a green base
    fastest, the safe default.
  - `- [ ] (b) forward-fix` — open a follow-up `conveyor-1-plan-create` issue for the
    fix (prefer this over revert when the change is hard to revert, e.g. a migration,
    or other work already landed on top).
  - `- [ ] (c) flake — rerun once more and re-verify` — if the eng owner judges it a
    slow / load-dependent flake the single rerun missed.

  Set `conveyor/land:needs-human` (add-before-remove against
  `conveyor/land:broke-develop`). The next drain run reads the ticked box and acts.

**Resolve from ticked boxes (drain run).** Read the status comment. `✅ Done` not
ticked → "still waiting", exit without changing the label. Done ticked → for the
parked decision: **exactly one option ticked** → act on it — **(a)** open the
revert PR (`git revert -m 1 <merge-sha>`), draft, `Closes` nothing, cross-link the
broken PR, hand it to `conveyor-3-implement` to drive green; **(b)** create the
follow-up plan issue (`conveyor-1-plan-create`) and link it; **(c)** rerun the run
once more and re-enter step 3. **None ticked** → apply the `✅ recommended` option
((a) revert) and note "applied recommended". **More than one ticked** → ambiguous,
re-surface just that decision, do not act.

### 5. Maintain the status comment

Keep the land status comment current (template below) — it is the human's dashboard
for "did the merge break the base, and if so, what do I decide". **Locate it
idempotently — exactly one.** Match the `## 🤖 Land status` heading among the PR's
comments: zero → create; exactly one → edit in place; more than one (a crashed
re-run double-posted) → keep the newest, delete the rest. Never blindly post a new
comment.

## Status comment template

```markdown
## 🤖 Land status

**State:** watching | needs-human | verified | broke-develop
**Merge commit:** <sha> (merged <when>, onto base <baseRefOid>)
**Develop run:** <run-url> — <pending | passed | failed>

### Verdict
clean — base healthy | broke develop (see decision below)

### Failing checks (classified)
| Check | On merge SHA | On pre-merge base | Bucket |
| --- | --- | --- | --- |
| <name> | red | red | broken-in-develop (not this merge) |
| <name> | red (stays red on rerun) | green | broke-develop |

### Decision (need a human)
_Tick one box (no tick = the ✅ recommended option), then tick Done. Do it in the GitHub web UI — no agent needed._

**Merge broke develop** — <which check> — <one-line diagnosis>
- [ ] (a) revert the merge ✅ recommended
- [ ] (b) forward-fix (open a follow-up plan)
- [ ] (c) flake — rerun once more and re-verify

- [ ] ✅ **Done — agent, pick this up**

_Last updated by: conveyor-5-land (<interactive|autonomous>)_
```

## Modes

- **Interactive**: watch the `develop` run live, classify, and either confirm
  `conveyor/land:verified` or park the revert / forward-fix decision.
- **Autonomous** (routine): same core, but poll the `develop` run between wakes
  instead of blocking; on a clean merge set `conveyor/land:verified`, on a
  regression park `conveyor/land:broke-develop` → `conveyor/land:needs-human` and
  exit. The mode for burning pooled tokens overnight.

## Rules

- Follow the shared [conventions](../CONVENTIONS.md) — **English only**, **no
  hard-wrapping**, **advisory lock** (here the watch label; the merge itself is
  already done by a human), **add-before-remove + reconciliation**, **async
  checkboxes** (read ticks first, never re-ask), and the **security carve-out** all
  apply here. Plus the rules specific to landing:
- **Never merge.** The merge is always a human action; this station only verifies
  the merge and, if it broke the base, surfaces the revert / forward-fix decision.
- Verify the **merge commit's** `develop` run, not the PR's old per-PR run — the
  regression this station catches only appears post-merge.
- A check that was already failing on the **pre-merge base** is not this PR's
  regression — baseline against `baseRefOid` and reuse the broken-in-develop bucket.
  Only **persistent** new red (still red across one rerun) counts as broke-develop;
  a single red that clears on rerun is a flake, and infra failures are their own
  bucket.
- Read the pre-merge / e2e / dev-env baseline from the relevant **CI run**, not by
  running it locally.
- On broke-develop, `@`-mention the **eng owner** from the `## Team` block (their
  gate — notification intended) and park the decision; prefer **revert** when it
  reverts cleanly, otherwise forward-fix.
