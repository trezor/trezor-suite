---
name: conveyor-4-review
description: Run the agentic review station on a green draft PR (label conveyor/review:queued). Request GitHub Copilot's review, run a triage-scaled adversarial second-opinion review in parallel, then process all findings — auto-fixing high-confidence low-risk ones and parking the rest for a human. Leaves a clean draft PR for a human to promote to "Ready for review". Runs interactively or autonomously (overnight routine). Use when asked to "review a PR", "run agentic review", or "process Copilot findings".
---

# conveyor-4-review

The agentic review station of the [workflow](../README.md): take a green draft PR
that `conveyor-3-implement` handed off (`conveyor/review:queued`) and get it review-clean while
it is still a draft, so the only thing left is a human's final look. Follow the
shared [conventions](../CONVENTIONS.md) for the house rules.

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
| **PR labels** | `conveyor/review:*` lifecycle (below) |

## When to use

- A fresh review: a PR labeled `conveyor/review:queued` and not
  `conveyor/review:in-progress`.
- A **drain run**: a PR labeled `conveyor/review:needs-human` where the human has
  ticked the answer checkboxes (see step 6) — re-run to resolve from their answers
  and continue.

## Inputs

- **Target PR.** An explicitly provided PR number; otherwise sweep the board in
  this order: the oldest `conveyor/review:queued` PR (fresh review), then the oldest
  `conveyor/review:needs-human` PR whose `✅ Done` box is ticked (drain), then any
  `conveyor/review:passed` PR whose branch HEAD has advanced past its `Reviewed at:`
  SHA (a **stale** review to re-open — see §0's staleness gate). A
  `conveyor/review:passed` PR still at its reviewed SHA is fresh — skip it with a
  single `headRefOid`-vs-SHA compare, no re-review. Finally, any
  `conveyor/review:in-progress` PR whose branch **and** status comment have gone stale
  (a crashed review lock — see §9's stale-takeover) — reconcile and take it over; a
  scan that skips the in-progress lock state leaves a crashed claim stuck forever.
- **Mode.** Interactive (human at keyboard) or autonomous (routine; never blocks).

## Process

### 0. Claim

**Reconcile first (step-0).** Look at the PR's `conveyor/review:*` labels. If it has zero
of them (orphan) or more than one, fix that before proceeding — drop the stale
ones so it carries exactly the one lifecycle label it should. **Also cross-check
that single label against the status comment's `State:` line.** If they disagree, a
previous run was interrupted between writing the comment and swapping the label —
re-derive the true state from the comment (unresolved open findings or a pending
split → `conveyor/review:needs-human`; all clean and the branch fresh →
`conveyor/review:passed`; an inconclusive in-progress run → treat as a stale lock
and take over) and align both the label (add-before-remove) and the `State:` line.
Only then claim.

Claim by **adding** `conveyor/review:in-progress` (the advisory review lock) **before**
removing the prior label (`conveyor/review:queued` on a fresh run, `conveyor/review:needs-human`
on a drain), so a crash mid-transition leaves an extra findable label, never zero.
The label is advisory only — two agents can race the read-then-write — so the real
guard is the branch on origin plus `--force-with-lease` (see §6). If the status
comment does not exist yet, create it from the template below; if one already
exists (re-run), reuse it.

**Staleness gate (if already `conveyor/review:passed`).** A review only vouches for the
exact commit it ran against. If the PR is `conveyor/review:passed` but the branch HEAD
has advanced past the `Reviewed at:` SHA in the status comment — Conveyor's own
aggressive rebase (`conveyor-3-implement` §4) or a human push moved it — the
review is **stale**: it must not be merged as-is. Re-open it (add
`conveyor/review:queued`, remove `conveyor/review:passed`, add-before-remove) and
re-review the delta (`git diff <reviewed-sha>..HEAD`) — a tiny rebase-only delta may
re-pass quickly; a real change goes through the full station. This is cheap
insurance against a green-but-stale review merging into a moved tree.

An autonomous sweep reaches this gate **proactively**: its board scan includes
`conveyor/review:passed` PRs precisely so a post-pass rebase/push (a repo bot or a
human moving HEAD after the review passed) is caught here, not left to chance until
the skill happens to be re-invoked. For a passed PR still at its `Reviewed at:` SHA
the check is a single `headRefOid`-vs-SHA compare — fresh, skip with no work.

**Drain run (entered at `conveyor/review:needs-human`).** The human has been ticking
answer checkboxes and/or leaving inline comments since the last run. **First drain the
inline threads** (CONVENTIONS "Async clarifications & directives"): your own
`conveyor:clarify` threads that now have a human answer, **and** any thread a human
started with `conveyor:` (a directive) — apply each, reply `✅ applied — <what changed>`,
and resolve it. Then skip fresh lens work (unless the diff changed since the
parked findings were written) and resolve from the ticked state exactly as in step 6's
"Resolve from ticked boxes": apply each finding's chosen option, honour an
approved/declined split, then re-run the readiness checks. If the `✅ Done` box is not
ticked **or** any clarify thread is still unanswered, the human is not finished —
report "still waiting" and exit without changing the lifecycle label.

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
  user-challenge. Surface the proposal to a human as a **checkbox** in the status
  comment (`- [ ] approve split (slices below)` / `- [ ] decline — review as one PR`)
  under the shared `✅ Done` box, and set `conveyor/review:needs-human`. The human
  ticks their choice async; the next drain run acts on it. In autonomous mode, park
  and exit.
- **On approval, each slice re-enters the line at the start** — lift the slice off
  the belt and set it back at the beginning as its own `conveyor-1-plan-create`
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

**Always probe termination & progress.** For every loop, retry, recursion, or poll
in the diff (or in code the diff newly relies on), one reviewer must verify it
**terminates and makes progress** — each iteration advances the state it branches
on, a retry eventually exhausts its options or backs off, and no path recurses on an
unchanged condition. A loop/retry that can spin on a value that never changes is a
finding even when every individual statement is correct. (This is the exact class
the adversarial pass missed on PR #28820 — a retry recursing on an unchanged
`this.port` — while it correctly checked resolve-safety. Check *both*.)

**Cite the line or flag it UNVERIFIED.** No "probably handled / likely tested" —
every claim that something is safe/handled/tested must cite `file:line` (as a clickable
permalink pinned to the reviewed SHA — see CONVENTIONS "Cite code as a clickable
permalink") or the test name, else label it UNVERIFIED; "looks fine" is **not** a finding. Attach a 1-10
**confidence** to each finding and gate the display: ≥7 shown normally, 5-6 shown
with a "verify" caveat, 3-4 collapsed unless it would be a P0. This kills
hallucinated all-clears and low-signal noise before it reaches the human gate.

**Always-on spec-fidelity reviewer (every triage size).** Independent of the
bug-hunters, run one reviewer whose only job is to read the **frozen spec** (the
linked issue — its `## Acceptance criteria / Definition of done` in particular)
and the diff side by side, and flag **drift**: acceptance criteria with no
implementation, scope that was silently dropped or added, behaviour that
contradicts the spec, and — critically — whether the new e2e/integration test
actually exercises the new feature (the existing suite passing is not proof).
This reviewer hunts *unimplemented scope*, not existing-code bugs, so it runs even
on a tiny diff.

**Capture a learning** when the review surfaces a recurring bug class or a reusable
codebase insight (not a one-off): append an entry to `.github/conveyor-learnings.md`
as a commit on this PR (see CONVENTIONS) so the next plan/implement run starts
warmer — it is human-reviewed at merge.

### 5. Collect Copilot's findings — wait for them, do not pass without them

Copilot is a bot that answers asynchronously, usually within a few minutes — its
findings are a **required input, not a bonus**. **Never finalize a review while
Copilot is still pending:** a `conveyor/review:passed` hand-off (§9) requires
Copilot's review to have *landed and been ingested*, not merely *requested*.
(Conveyor has already hit this: an autonomous run passed PR #28820 ~3 minutes
before Copilot replied, and Copilot caught a real retry-loop bug the pass missed.)

Poll for Copilot's review with a **bounded wait** (e.g. up to ~8 minutes, backing
off between checks):

```bash
gh api repos/<owner>/<repo>/pulls/<n>/reviews \
  --jq '.[] | select(.user.login=="copilot-pull-request-reviewer[bot]")'
```

- **Landed** → pull its review body and inline comments and merge them with your
  adversarial findings into one set; process them all in step 6.
- **Still pending after the wait** → do **not** pass. Either continue with other
  unblocked work and re-check on the next wake, or park to
  `conveyor/review:needs-human` with the Copilot row marked `pending (held)` and a
  note "held for Copilot — re-run to ingest". A later drain ingests it. A hand-off
  that records Copilot as `requested / in-progress` at pass time is a **bug** in
  this station.

### 6. Process the findings

Gate for noise, then classify each finding by who resolves it (same model as
`conveyor-2-plan-review`):

- **Skip-memory (don't re-litigate dismissed findings).** Fingerprint each finding
  `path:line:category` and record it in the status comment with its triage action
  (auto-fixed / human-fixed / parked-skipped). On a re-review (after a rebase or new
  commits), **suppress only `parked-skipped` findings whose file is unchanged since
  the prior review** (`git diff --name-only <prior-review-sha> HEAD`); **always
  re-check fixed ones** (they can regress). Note "Suppressed N findings the human
  already dismissed (code unchanged)" — never silently, and never re-surface what a
  human waved off.
- **Noise gate.** Consider findings at confidence ≥ 6/10; always consider
  anything that looks like a real bug or a security issue regardless of
  confidence. Drop pure style nits.
- **Auto-fix** — only when **all** hold: confidence is high (≥ 8/10), the fix is
  clear and mechanical, it is low-risk, and it does not change intended behaviour
  or the spec. Never classify a signing / key-handling / persistence / privacy
  finding as mechanical — those always route to a human (park). **For a behavioural
  fix, add a regression test only where it adds real signal — survey existing coverage
  first** (see CONVENTIONS "Tests"): extend a test that already exercises the path
  rather than duplicate, and if the suite already guards the behaviour, none is needed.
  Use a `// Regression: #<issue>` guard for a genuine, easily-reintroduced bug. Do
  **not** auto-park a clean low-risk fix merely for lacking a brand-new test; park when
  the fix is risky **and** genuinely uncovered. Apply it, commit (conventional commit;
  for a bug in a specific earlier commit prefer `--fixup`).
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
  comment's "Open findings" as a **checkbox list** of options (e.g.
  `- [ ] fix this way`, `- [ ] fix that way`, `- [ ] accept as-is`) with your
  `✅ recommended`, under one shared `✅ Done` box — so the human resolves it by
  **ticking a box in the GitHub web UI** (async, no agent running). Never auto-apply.
- **Clarify inline when it is an open question, not a finite choice.** If a finding is
  really an open question about specific code that only the author can answer (not a
  pick-one-of-N decision), post it as an inline `conveyor:clarify` thread on that line
  instead of a checkbox (see CONVENTIONS "Async clarifications"); the next drain reads
  the reply, applies it, and resolves the thread. Evaluate which you need before
  defaulting to checkboxes.
- **After an auto-fix push, re-watch CI.** Poll `gh pr checks` (0 = all pass, 8 =
  some pending, 1 = some failed) and keep polling while anything is pending. If
  the fix breaks a check, only count a fix attempt against a check whose
  conclusion is actually `failure` — never against a pending/queued one, and never
  against an infra/transient failure (registry 5xx, emulator boot, runner OOM):
  those back off and retry the same commit. Honour the global run budget (default
  10 total fix attempts); on exhaustion, park as `conveyor/review:needs-human`.

**Resolve from ticked boxes (drain run).** On a drain run (§0), the human has
ticked checkboxes since the parked findings were written. Read the status comment:
- **`✅ Done` box not ticked** → the human is not finished; report "still waiting"
  and exit without changing the label.
- **Done ticked** → for each open finding and the split proposal: **exactly one
  option ticked** → apply it (a chosen fix goes through the same commit →
  force-with-lease → resolve-thread flow as an auto-fix); **none ticked** → apply
  the `✅ recommended` option and note "applied recommended"; **more than one
  ticked** → ambiguous, re-surface just that one and do not pass it.

### 7. Maintain the status comment

Keep the review status comment current (template below). It is the human's
one-stop dashboard for "what did the agents find, what did they fix, what is left
for me".

**Locate it idempotently — exactly one, edited in place where you can** (see CONVENTIONS
"One dashboard comment"). Find your status comment by the `## 🤖 Review status` heading
and **remember its comment id when you create it**. **When `gh` / REST is available**, on
every later update **edit that same comment** —
`gh api -X PATCH repos/<owner>/<repo>/issues/comments/<id> -F body=@file` — so the
intermediate `State: in-progress` dashboard and the final `passed` / `needs-human`
dashboard are the **same comment updated**, never a second post; if more than one matches
(a prior run double-posted), keep the newest and **delete the rest**
(`gh api -X DELETE …/issues/comments/<id>`). **When the environment genuinely has no
`gh` / REST** (some scheduled-routine cloud envs expose only a GitHub MCP that can append
comments and set labels but cannot edit or delete them — see #28950): post **one**
clearly-marked superseding dashboard and treat the `conveyor/review:*` **label as the
authoritative state**; a later `gh`-capable run reconciles the duplicate. Report the path
you took honestly — do not fake a PATCH you cannot make, and do not post a second comment
when you can edit the first.

### 8. Freshness check (before any clean hand-off)

A long review can leave the branch stale or red against `develop`. Before handing
off `conveyor/review:passed`, check the branch against `origin/develop`
(`git rev-list --count origin/develop ^<branch>` for how far behind). The
`conveyor/review:in-progress` label is the lock you hold through this.

- If it is **> 20 commits behind**, rebase onto `develop`, run a **local
  type-check before pushing**, then `git fetch origin <branch>` and (if it did not
  advance with a commit you did not author) `git push --force-with-lease`. A
  lease rejection means you lost the lock — stop and reconcile, do not retry.
- If the rebase surfaces non-trivial conflicts or the post-rebase build/tests go
  red, **bounce it back to implementation** (`conveyor/impl:in-progress` for that station to
  pick up) rather than hand off a broken PR — note why in the status comment.
- Only a green, reasonably-fresh branch proceeds to the clean hand-off.

### 9. Hand off

Always **add** the new label **before** removing `conveyor/review:in-progress`, so a crash
mid-transition leaves an extra findable label, never zero.

- **Clean** (Copilot's review has landed and been ingested, nothing parked, no
  unresolved real/security finding, branch fresh):
  add `conveyor/review:passed`, then remove `conveyor/review:in-progress`. **Record the
  reviewed SHA** (`git rev-parse HEAD`) as a `**Reviewed at:** <sha>` line in the
  status comment — the review only vouches for *that* commit. Comment a summary. The
  PR stays a **draft** — a human now verifies it and flips it to "Ready for review".
  That flip is the **human-review handoff**: it moves the PR to
  `conveyor/human:needs-approval` and GitHub's **CODEOWNERS** auto-requests the owning
  reviewer — the required single approval, which the author cannot give. When no
  CODEOWNERS entry matches these files, the belt falls back to requesting the
  `## Team` reviewer. The label swap itself is done by the `conveyor-human-handoff`
  Action on the flip **or**, if that Action isn't installed, by the belt when it sees a
  non-draft `conveyor/review:passed` PR (see the README) — either way it becomes
  `conveyor/human:needs-approval`, so the flip is never stranded. Do **not** `@`-mention
  or request a reviewer yourself here; the request is owned by that handoff, at the flip.
- **Parked** (open findings remain): add `conveyor/review:needs-human`, then remove
  `conveyor/review:in-progress`. `conveyor/review:needs-human` is hands-off for other agents until a
  human resolves the open findings (then re-run `conveyor-4-review` to continue).

**Stale-takeover of a crashed review.** `conveyor/review:in-progress` is advisory, so a
crashed run can leave a PR stuck under it with no agent working. If a PR carries
`conveyor/review:in-progress` but its branch has had no new commit and the status comment
no update for a stale interval, treat the lock as abandoned: reconcile (step-0)
and take it over — never leave it a silent dead PR.

## Status comment template

```markdown
## 🤖 Review status

**State:** in-progress | needs-human | passed
**Reviewed at:** <sha the review vouches for — set on passed; if HEAD has moved past it, the review is stale>
**Triage:** <N files, ~M lines> — risk: low | medium | high (<sensitive areas>)
**Split:** not needed | proposed (see below) — <n slices> | declined (do not re-propose)

### Split proposal (if any)
<slices: **(a)** … delivers …, depends on …; **(b)** …>
- [ ] approve split — slices re-enter the line as new plans
- [ ] decline — review as one PR ✅ recommended

### Open findings (need a human)
_Tick one box per finding (no tick = the ✅ recommended option), then tick Done. Do it in the GitHub web UI — no agent needed._
_Inline clarifications open: <M> — answer them on the diff (an open `conveyor:clarify` thread gates needs-human alongside the boxes here). "0" when none._

**1. <title>** — <file:line> — [taste | risky | changes-spec]
- [ ] (a) <fix this way> ✅ recommended
- [ ] (b) <fix that way>
- [ ] (c) accept as-is

- [ ] ✅ **Done — agent, pick this up**

### Resolved
- <title> — <file:line> — fixed in <sha> (<source: copilot | adversarial>)

### Reviews run
| Review | Status | Findings |
| --- | --- | --- |
| Copilot | delivered / pending (held) — never "requested" at pass | <n> |
| Adversarial | <n reviewers> | <n> |
| Spec-fidelity | done | <n drift items> |

_Last updated by: conveyor-4-review (<interactive|autonomous>)_
```

## Modes

- **Interactive**: request Copilot, run adversarial review, process findings live,
  hand off.
- **Autonomous** (routine): same core, with the **bounded Copilot wait of §5
  inside the run**. Its board sweep also includes `conveyor/review:passed` PRs for a
  cheap staleness check (`headRefOid` vs `Reviewed at:` SHA), re-opening only those
  whose HEAD moved — so a post-pass rebase is re-reviewed automatically, not left to
  chance. If Copilot has still not landed by the end of the wait, park
  (`conveyor/review:needs-human`, "held for Copilot") rather than pass — a later
  wake drains it. **Never set `conveyor/review:passed` on a PR whose Copilot review
  has not landed and been ingested.** On clean set `conveyor/review:passed`, on
  parked set `conveyor/review:needs-human`. The mode for burning pooled tokens
  overnight.

## Rules

- Follow the shared [conventions](../CONVENTIONS.md) — **English only**, **no
  hard-wrapping**, **advisory lock = branch + `git push --force-with-lease`**
  (fetch-and-abort), **add-before-remove + reconciliation**, **async checkboxes**
  (read ticks first, never re-ask), and the **security carve-out** all apply here.
  Plus the rules specific to review:
- Never promote the PR to "Ready for review" — that is the human's signal.
- Copilot's review is a **required input**: never hand off `conveyor/review:passed`
  while Copilot is still pending — bounded-wait for it (§5), ingest its findings,
  and park ("held for Copilot") if it has not landed by the end of the wait.
- **Probe termination & progress** on every loop / retry / recursion / poll (§4) —
  a loop that can spin on an unchanged condition is a finding even when each
  statement is individually correct.
- Check splittability before the deep review; never auto-split — a split is a
  user-challenge, so propose it and let a human approve. Use a concrete bar
  (> ~800 lines OR > 15 files AND ≥ 2 independent symbol-disjoint concerns) and
  record a declined split so it is never re-proposed.
- The issue is frozen once the PR exists; write everything to the PR.
- Auto-fix only high-confidence, low-risk, behaviour-preserving findings; park
  everything else.
- Adversarial reviewers hunt bugs and breakage, not style — leave lint/format to
  CI. Always run the spec-fidelity reviewer too (frozen spec vs diff), at every
  triage size, to catch unimplemented scope / drift.
- Scale review depth to the triage; never run a single light pass over a large or
  signing-sensitive diff.
- Respect `conveyor/review:*` locks on other PRs, but treat a
  `conveyor/review:in-progress` whose branch and status comment have gone stale as
  an abandoned lock to reconcile and take over.
