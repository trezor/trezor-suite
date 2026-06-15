---
name: conveyor-implement
description: Pick up a plan:ready-to-implement GitHub issue, claim it with a lock label, implement it per the consolidated plan, open a draft PR linked to the issue, then drive CI to green and keep the branch fresh (aggressive rebase) until the work is ready for agentic review. Runs interactively or autonomously (overnight routine). Use when asked to "implement a plan", "pick up an issue", or "drive a PR to green".
---

# conveyor-implement

Take a `plan:ready-to-implement` issue all the way to a green, up-to-date draft
PR that is ready for the agentic review phase. This is the third step of the
[planning workflow](../README.md); read that README for the data model,
lifecycle, and token-pooling model before running.

**The draft's goal is to prove the feature works — a proof of concept.** Build the
complete feature from the plan and prove it end to end: CI must build a dev
environment and the e2e tests must pass. Only once that is green does the
review/QA work begin (the next station). So this skill ends at **a proven PoC: CI
green including the dev-environment build and e2e + fresh branch + draft PR open**.
It does **not** do the code review or the split — those are the next station.

## When to use

- An issue is labeled `plan:ready-to-implement` and is **not** locked
  (`impl:in-progress`) or blocked (`impl:needs-human`).
- Or you are resuming an issue whose lock has gone stale (see step 0).

## Inputs

- **Target issue.** A passed issue number, or — if none given — the oldest
  `plan:ready-to-implement` issue that is not locked.
- **Mode.**
  - **Interactive** (default): a human is at the keyboard; watch CI live.
  - **Autonomous**: a routine / overnight run; poll CI between wakes, never block
    on a human, and park to `impl:needs-human` when stuck.

## Process

### 0. Claim the lock

The branch lives on `origin` and is the shared state. **The label lock is
advisory only** — two agents can race it (read-then-write over two API calls, no
compare-and-swap). The **real lock is the branch on `origin`** plus
`git push --force-with-lease`: whoever owns the branch tip owns the work.

- **Step 0 — reconcile state first.** If the issue has **zero** conveyor
  lifecycle labels (orphan) or **more than one**, fix that before proceeding
  (an interrupted transition can leave an extra or missing label).
- Refuse to start if the issue is `impl:in-progress` or `impl:needs-human`,
  **unless** the lock is **stale**: the PR branch has had no new commits pushed
  for a while (treat as abandoned — the previous agent ran out of tokens or
  died). Only then take over.
- Swap labels **add-before-remove**: add `impl:in-progress` first, then remove
  `plan:ready-to-implement` (a crash mid-swap leaves an extra label, findable —
  never zero, an invisible orphan).
- **Re-read immediately after adding the label.** If a *second*
  `impl:in-progress` appeared (another agent raced you), back off — you lost the
  race; reconcile to a single owner before doing anything.
- Create or check out the feature branch and push it to `origin` immediately, so
  the lock and the branch exist together. A **non-fast-forward rejection on this
  first push** means another agent already created the branch — you lost the
  claim, stop and reconcile rather than clobbering it.

### 1. Implement

- Read the issue body — it is the consolidated plan and the single source of
  truth for what to build.
- Follow the repo's mandatory code-style skills (see the root `CLAUDE.md`).
- Commit in logical, conventional-commit chunks and **push to `origin`
  frequently**. Frequent pushes are what make the work resumable by another agent
  or routine if you run out of tokens — the pushed branch is the shared state.
- Before opening the PR, run the repo's local gates (lint, type-check via
  `nx affected`, affected tests) so you do not waste CI cycles on trivially
  catchable failures.

### 2. Open the draft PR — lifecycle moves to the PR

- Open it as a **draft**, base `develop`, head your branch.
- Body: a short summary of the approach, and `Closes #<issue>` to link it.
- **Remove the auto-requested CODEOWNERS reviewers right away.** Opening the PR
  auto-requests reviewers; clear them now so humans are not pinged early — they
  are only (re-)requested at the `review:passed` handoff, by the human who flips
  the draft to ready.
- Post a one-time comment on the issue with the PR URL. **From here on the issue
  is the frozen spec — do not update it.** All working state lives on the PR.
- **Migrate the lock to the PR add-before-remove:** add `impl:in-progress` to the
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
pass e2e has not yet earned the review station. **Readiness also requires at
least one NEW e2e / integration test that actually exercises the new feature —
and you must watch THAT test pass.** The existing suite staying green is not
proof the feature works.

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
  `origin`** (only ever force-push a branch you hold the `impl:in-progress` lock
  on). A non-fast-forward / lease rejection means you **lost the claim** → stop
  and reconcile, do **not** retry the push.
- Re-enter step 3 (the rebase re-triggers CI).

**Global run budget.** Every autonomous run is bounded by a hard ceiling —
**max 10 total fix attempts, max 3 rebase cycles, and a wall-clock / iteration
cap**, whichever trips first. The per-check "3 attempts" cap still stands, but
this global budget guarantees termination even when each rebase surfaces a
different upstream-churn failure. When the budget is exhausted, route to step 6
(`impl:needs-human`).

### 5. Done — PoC proven, hand off to review

When the PoC is proven (CI green incl. dev-environment build and e2e) and the
branch is fresh:

- Swap labels on the **PR** add-before-remove: add `review:queued` first, then
  remove `impl:in-progress`.
- Comment the handoff on the PR.
- Report the PR URL and that it is ready for the agentic review phase
  (`conveyor-review`). The PR stays a **draft** — promoting to "Ready for review" is a
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
  stuck / the plan is wrong / the spec contradicts itself) **and the numbered
  options you see** — e.g. (1) try fix approach X, (2) try approach Y, (3) relax
  constraint Z in the plan, (4) bounce back to planning — with your
  recommendation. The human should be able to unblock you by picking a number,
  not by working out the options themselves.
- Swap labels on the **PR** add-before-remove: add `impl:needs-human` first, then
  remove `impl:in-progress`.
- Exit. `impl:needs-human` means hands-off for other agents until a human
  intervenes. **Resume path:** a human clears `impl:needs-human` (after fixing
  it, or bouncing the plan back to the planning phase), handing the PR back to a
  re-claimable state.

## Modes

- **Interactive**: implement, open PR, watch CI live, fix, rebase, hand off.
- **Autonomous** (routine): same core, but between CI runs you sleep and poll
  rather than block; on success set `review:queued`, on stuck set
  `impl:needs-human`. This is the mode meant for burning pooled tokens overnight.
  Bounded by the **hard per-run budget** (10 total fix attempts, 3 rebase cycles,
  wall-clock cap — see step 4). **Intake rule:** before starting a *new* issue,
  first resume the highest-priority non-stale in-progress PR and drive its CI —
  finish in-flight work before opening more.

## Rules

- The label lock is advisory; the **branch on `origin` is the real lock**. Hold
  it before touching the branch; only ever force-push a branch you have locked,
  and always with `git push --force-with-lease`. Respect `impl:in-progress` /
  `impl:needs-human` on other issues.
- **Every label transition is add-before-remove** (extra label on a crash, never
  zero).
- Before any force-push, `git fetch origin <branch>`; abort if the tip advanced
  with a commit you did not author. A non-fast-forward / lease rejection = lost
  claim → stop, do not retry.
- Push to `origin` (the upstream repo), never a fork — CI workflows fetch from
  the upstream branch.
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
  stops at `review:queued`.
