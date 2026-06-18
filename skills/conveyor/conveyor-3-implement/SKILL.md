---
name: conveyor-3-implement
description: Pick up a conveyor/plan:ready-to-implement GitHub issue, claim it with a lock label, implement it per the consolidated plan, open a draft PR linked to the issue, then drive CI to green and keep the branch fresh (aggressive rebase) until the work is ready for agentic review. Runs interactively or autonomously (overnight routine). Use when asked to "implement a plan", "pick up an issue", or "drive a PR to green".
---

# conveyor-3-implement

Take a `conveyor/plan:ready-to-implement` issue all the way to a green, up-to-date draft
PR that is ready for the agentic review phase. This is the third step of the
[planning workflow](../README.md); read that README for the data model,
lifecycle, and token-pooling model, and the shared [conventions](../CONVENTIONS.md)
for the house rules, before running.

**The draft's goal is to prove the feature works — a proof of concept.** Build the
complete feature from the plan and prove it end to end: CI must build a dev
environment and the e2e tests must pass. Only once that is green does the
review/QA work begin (the next station). So this skill ends at **a proven PoC: CI
green including the dev-environment build and e2e + fresh branch + draft PR open**.
It does **not** do the code review or the split — those are the next station.

## When to use

- A fresh build: an issue labeled `conveyor/plan:ready-to-implement` and **not**
  locked (`conveyor/impl:in-progress`) or blocked (`conveyor/impl:needs-human`).
- A **drain run**: a PR labeled `conveyor/impl:needs-human` where the human has
  ticked the answer checkboxes (see step 6) — re-run to read their choice and act.
- Or you are resuming an issue whose lock has gone stale (see step 0).

**If asked to implement a plan that is not yet `conveyor/plan:ready-to-implement`:**
read the issue's status comment **first** — the decisions may already be answered.
- `conveyor/plan:needs-human` with the **`✅ Done` box ticked** → the human has
  already answered via the checkboxes. The plan just needs draining: run
  `conveyor-2-plan-review` (drain) to apply the ticks, reconsolidate the plan, and
  promote it to `ready-to-implement` — then implement. **Never ask the human to
  re-answer decisions they have already ticked in GitHub.**
- `conveyor/plan:needs-human` with **Done not ticked** → the human has not
  finished. Point them at the `- [ ]` boxes in the status comment (tick the
  choices + Done, async in the GitHub UI) and re-run `conveyor-2-plan-review` to
  drain. Do **not** ask them to type an answer in chat as if there were no
  checkboxes.

## Inputs

- **Target issue.** A passed issue number, or — if none given — the oldest
  `conveyor/plan:ready-to-implement` issue that is not locked.
- **Mode.**
  - **Interactive** (default): a human is at the keyboard; watch CI live.
  - **Autonomous**: a routine / overnight run; poll CI between wakes, never block
    on a human, and park to `conveyor/impl:needs-human` when stuck.

## Process

### 0. Claim the lock

The branch lives on `origin` and is the shared state. **The label lock is
advisory only** — two agents can race it (read-then-write over two API calls, no
compare-and-swap). The **real lock is the branch on `origin`** plus
`git push --force-with-lease`: whoever owns the branch tip owns the work.

- **Step 0 — reconcile state first.** If the issue has **zero** conveyor
  lifecycle labels (orphan) or **more than one**, fix that before proceeding
  (an interrupted transition can leave an extra or missing label).
- Refuse to start if the issue is `conveyor/impl:in-progress` or `conveyor/impl:needs-human`,
  **unless** the lock is **stale**: the PR branch has had no new commits pushed
  for a while (treat as abandoned — the previous agent ran out of tokens or
  died). Only then take over.
- Swap labels **add-before-remove**: add `conveyor/impl:in-progress` first, then remove
  `conveyor/plan:ready-to-implement` (a crash mid-swap leaves an extra label, findable —
  never zero, an invisible orphan).
- **Re-read immediately after adding the label.** If a *second*
  `conveyor/impl:in-progress` appeared (another agent raced you), back off — you lost the
  race; reconcile to a single owner before doing anything.
- Create or check out the feature branch and push it to `origin` immediately, so
  the lock and the branch exist together. A **non-fast-forward rejection on this
  first push** means another agent already created the branch — you lost the
  claim, stop and reconcile rather than clobbering it.

### 1. Implement

- Read the issue body — it is the consolidated plan and the single source of
  truth for what to build.
- **When the plan is genuinely ambiguous about a specific line you are writing,
  ask — do not guess.** Evaluate which you need: a *decision* (finite options you
  weighed → park a checkbox at step 6) or a *clarification* (an open question anchored
  to specific code → post an inline `conveyor:clarify` thread on that line; see
  CONVENTIONS "Async clarifications"). A one-line uncertainty deserves a one-line
  inline question, not a silent guess and not parking the whole feature. On a **drain
  run** (resuming an `impl:needs-human` PR), drain the inline threads first — your
  answered `conveyor:clarify` threads **and** any `conveyor:` directives a human left —
  incorporate/apply and resolve them before continuing.
- **Load project learnings** (`.github/conveyor-learnings.md`, see CONVENTIONS) for
  the issue's Affected areas before you start; when one shapes your approach,
  annotate `Applied prior learning: <key>` in the PR.
- Follow the repo's mandatory code-style skills (see the root `CLAUDE.md`).
- **Capture new learnings as you go:** when you hit a codebase gotcha worth
  remembering (build order, a package quirk, a recurring trap), append an entry to
  `.github/conveyor-learnings.md` **in this PR** — it is human-reviewed at merge.
- Commit in logical, conventional-commit chunks and **push to `origin`
  frequently**. Frequent pushes are what make the work resumable by another agent
  or routine if you run out of tokens — the pushed branch is the shared state.
- Before opening the PR, run the repo's local gates (lint, type-check via
  `nx affected`, affected tests) so you do not waste CI cycles on trivially
  catchable failures.

### 2. Open the draft PR — lifecycle moves to the PR

- Open it as a **draft**, base `develop`, head your branch.
- Body: a short summary of the approach, `Closes #<issue>` to link it, and **copy
  the `## Team` block** from the issue into the PR (still with handles **without a
  leading `@`** — no notifications yet; people are requested/assigned at their own
  gate).
- **Remove the auto-requested CODEOWNERS reviewers right away.** Opening the PR
  auto-requests reviewers; clear them now so humans are not pinged early — they are
  auto-requested again by GitHub **CODEOWNERS** at the draft→ready flip (the
  human-review handoff, where the PR moves to `conveyor/human:needs-approval`); if
  CODEOWNERS matches no owner, the belt falls back to the `## Team` reviewer.
- Post a one-time comment on the issue with the PR URL. **From here on the issue
  is the frozen spec — do not update it.** All working state lives on the PR.
- **Migrate the lock to the PR add-before-remove:** add `conveyor/impl:in-progress` to the
  PR *first*, then remove it from the issue. Every lifecycle label from now on
  lives on the PR, not the issue.
- Labels via REST API (not `gh pr edit`): `no-project` + `code` (this is product
  code).

### 3. Drive CI to green

Poll the checks (`gh pr checks <pr>`; in interactive mode you may
`--watch`). **Mind the exit code: `0` = all pass, `8` = some pending, `1` = some
failed.** Keep polling while anything is pending (8); only act on real failures
(1). **Only count a fix attempt against a check whose CONCLUSION is actually
`failure`** — never against one that is still pending/queued. "Green" means green
— but with escape valves so you do not burn tokens on failures that are not yours
to fix.

For each **failing** check, classify it into one of **four buckets**:

- **Caused by this PR** → read the run logs, fix the cause, push. Track attempts
  **per check**. After **3 failed fix attempts on the same check**, stop — go to
  step 6 (give up).
- **Broken in `develop` already** → verify the same check also fails on
  `origin/develop` (pre-existing / broken gate, not your fault). Note it in a PR
  comment and stop chasing it; it does not block readiness.
- **Flaky** (non-deterministic, passes on rerun) → rerun the failed jobs **up to
  2 times**. Headless `gh run rerun --failed` needs a run-id:
  `gh run list --branch <branch> --json databaseId,conclusion,name` → pick the
  failed run → `gh run rerun <id> --failed` (and `gh run view <id> --log` for
  logs). If it goes green, fine. If it keeps failing deterministically, treat it
  as "caused by this PR".
- **Infra / transient environment** (registry 5xx, emulator / trezor-user-env
  boot failure, runner OOM, network) → do **not** count it against the budget,
  do **not** push a speculative fix; back off and retry the **same** commit. If
  it persists, park as "infra, not the PR".

Readiness requires every check green except those documented as broken-in-develop
— and that explicitly includes the **proof-of-concept gates**: the
dev-environment build and the e2e tests. A PoC is only proven when those are
green; a feature that builds units but does not stand up a dev environment or
pass e2e has not yet earned the review station. **Cover the change where a test
adds real signal — but survey first and never by quota** (see CONVENTIONS
"Tests"): search the affected package's existing tests and prefer **extending**
what is there over writing new ones. Add a test only where it genuinely de-risks
the change, and watch it pass. A behaviour-preserving refactor, a deletion, or a
docs/process change may correctly need **no** new test — there the green existing
suite is the proof, and an invariant/unit check named in the acceptance criteria
is enough. Do not bolt on a low-signal e2e to satisfy a mandate.

### 4. Keep the branch fresh (aggressive rebase)

Whenever the branch is **more than 20 commits behind `origin/develop`**:

- Rebase onto `origin/develop`, resolving conflicts.
- **Run type-check locally before force-pushing.** Rebasing in this repo can
  silently auto-merge files so that tests still pass but type-check breaks
  (e.g. TS2552) — CI would catch it, but checking locally saves a full CI cycle.
- **Before any force-push, `git fetch origin <branch>` and check the tip.** If it
  advanced with a commit you did **not** author, STOP — a human or a repo bot
  (e.g. `bot-rebase.yml`) pushed; never clobber it. Re-verify you still hold the
  lock immediately before pushing.
- Force-push with `git push --force-with-lease` to **your locked branch on
  `origin`** (only ever force-push a branch you hold the `conveyor/impl:in-progress` lock
  on). A non-fast-forward / lease rejection means you **lost the claim** → stop
  and reconcile, do **not** retry the push.
- Re-enter step 3 (the rebase re-triggers CI).

**Global run budget.** Every autonomous run is bounded by a hard ceiling —
**max 10 total fix attempts, max 3 rebase cycles, and a wall-clock / iteration
cap**, whichever trips first. The per-check "3 attempts" cap still stands, but
this global budget guarantees termination even when each rebase surfaces a
different upstream-churn failure. When the budget is exhausted, route to step 6
(`conveyor/impl:needs-human`).

### 5. Done — PoC proven, hand off to review

When the PoC is proven (CI green incl. dev-environment build and e2e) and the
branch is fresh:

- Swap labels on the **PR** add-before-remove: add `conveyor/review:queued` first, then
  remove `conveyor/impl:in-progress`.
- Comment the handoff on the PR.
- Report the PR URL and that it is ready for the agentic review phase
  (`conveyor-4-review`). The PR stays a **draft** — promoting to "Ready for review" is a
  human's job, after the agentic review is clean.

### 6. Give up — park for a human

Stop and hand back when any of:

- 3 fix attempts on the same check have failed (or the global run budget is
  exhausted), or
- a failure makes clear the **plan itself is wrong** (the approach cannot work as
  specified), or
- **CI is green but the spec is wrong / contradictory** — the "frozen" spec means
  humans coordinate spec changes, not that the spec is assumed correct. If the
  feature builds and passes but the plan contradicts itself or cannot be the
  intended behaviour, park rather than ship the wrong thing.

Then:

- Post a PR comment with your diagnosis (which check, what you tried, why it is
  stuck / the plan is wrong / the spec contradicts itself) **and the options you
  see as a checkbox list** under a `✅ Done` box — e.g.
  `- [ ] (a) try fix approach X ✅ recommended`, `- [ ] (b) try approach Y`,
  `- [ ] (c) relax constraint Z in the plan`, `- [ ] (d) bounce back to planning`.
  The human ticks a box in the GitHub web UI (async, no agent running), never works
  out the options themselves.
- **If a blocker is an open question about specific code** (not a finite decision),
  post it as an inline `conveyor:clarify` thread on that line instead of — or
  alongside — the checkbox options (see CONVENTIONS "Async clarifications"), and say in
  the diagnosis how many inline clarifications are open so the human answers them on
  the diff. The next drain reads the replies, incorporates them, and resolves the
  threads.
- **Pull in the eng owner — this is their gate.** If the `## Team` block names an
  eng owner, request/assign them now and `@`-mention them in the diagnosis comment
  (a notification here is intended — implementation is stuck and needs them). If
  there is no eng owner, fall back to the Product owner.
- Swap labels on the **PR** add-before-remove: add `conveyor/impl:needs-human` first, then
  remove `conveyor/impl:in-progress`.
- Exit. `conveyor/impl:needs-human` means hands-off for other agents until a human
  acts. **Resume path (drain):** the human ticks a box + the `✅ Done` box and/or
  replies to inline `conveyor:clarify` threads; re-run `conveyor-3-implement` on the
  PR. It **first drains the inline threads** (its answered `conveyor:clarify` threads
  **and** any `conveyor:` directives a human left — apply each, reply `✅ applied`,
  resolve it — see CONVENTIONS "Async clarifications & directives"), then reads the
  ticked choice (exactly one = that option; none = the recommended one). It is
  **finished only when `✅ Done` is ticked AND every clarify thread is answered**; if
  Done is unticked **or** any clarify thread is still unanswered, it is still waiting —
  act on what is ready, then exit without changing the label. Otherwise act on the
  choice (retry the chosen approach, or bounce the plan back to planning).

## Modes

- **Interactive**: implement, open PR, watch CI live, fix, rebase, hand off.
- **Autonomous** (routine): same core, but between CI runs you sleep and poll
  rather than block; on success set `conveyor/review:queued`, on stuck set
  `conveyor/impl:needs-human`. This is the mode meant for burning pooled tokens overnight.
  Bounded by the **hard per-run budget** (10 total fix attempts, 3 rebase cycles,
  wall-clock cap — see step 4). **Intake rule:** before starting a *new* issue,
  first resume the highest-priority non-stale in-progress PR and drive its CI —
  finish in-flight work before opening more.

## Rules

- Follow the shared [conventions](../CONVENTIONS.md) — **English only**, **no
  hard-wrapping**, **advisory lock = branch + `git push --force-with-lease`**
  (fetch-and-abort, push to `origin` not a fork), **add-before-remove +
  reconciliation**, and **async checkboxes** (read ticks first, never re-ask) all
  apply here. Plus the rules specific to implementation:
- Respect `conveyor/impl:in-progress` / `conveyor/impl:needs-human` on other issues.
- Push frequently so the work is resumable.
- Type-check locally after every rebase before force-pushing.
- Green = green, minus documented broken-in-develop gates. **Infra / transient
  failures are their own bucket** — back off and retry the same commit, never
  count them against the budget or push a speculative fix. Do not chase flaky or
  pre-existing failures past the escape valves.
- Give up at 3 attempts per check, when the **global run budget** is exhausted,
  if the plan is wrong, or if CI is green but the spec is contradictory — never
  loop CI forever.
- Once the PR is open, the issue is the frozen spec; all lifecycle labels and
  working state live on the PR.
- PRs stay drafts — only a human promotes to "Ready for review". This skill
  stops at `conveyor/review:queued`.
