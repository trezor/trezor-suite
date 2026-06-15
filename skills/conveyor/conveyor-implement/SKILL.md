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

The branch lives on `origin` and is the shared state; the lock label prevents two
agents from working the same issue at once (essential — this skill force-pushes).

- Refuse to start if the issue is `impl:in-progress` or `impl:needs-human`,
  **unless** the lock is **stale**: the PR branch has had no new commits pushed
  for a while (treat as abandoned — the previous agent ran out of tokens or
  died). Only then take over.
- Swap labels: remove `plan:ready-to-implement`, add `impl:in-progress`.
- Create or check out the feature branch and push it to `origin` immediately, so
  the lock and the branch exist together.

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
- Post a one-time comment on the issue with the PR URL. **From here on the issue
  is the frozen spec — do not update it.** All working state lives on the PR.
- **Migrate the lock to the PR:** add `impl:in-progress` to the PR and remove it
  from the issue. Every lifecycle label from now on lives on the PR, not the
  issue.
- Labels via REST API (not `gh pr edit`): `no-project` + `code` (this is product
  code).

### 3. Drive CI to green

Poll the checks (`gh pr checks <pr>`; in interactive mode you may
`--watch`). "Green" means green — but with two escape valves so you do not burn
tokens on failures that are not yours to fix:

For each **failing** check, classify it:

- **Caused by this PR** → read the run logs, fix the cause, push. Track attempts
  **per check**. After **3 failed fix attempts on the same check**, stop — go to
  step 6 (give up).
- **Broken in `develop` already** → verify the same check also fails on
  `origin/develop` (pre-existing / broken gate, not your fault). Note it in a PR
  comment and stop chasing it; it does not block readiness.
- **Flaky** (non-deterministic, passes on rerun) → rerun the failed jobs a few
  times (`gh run rerun --failed`). If it goes green, fine. If it keeps failing
  deterministically, treat it as "caused by this PR".

Readiness requires every check green except those documented as broken-in-develop
— and that explicitly includes the **proof-of-concept gates**: the
dev-environment build and the e2e tests. A PoC is only proven when those are
green; a feature that builds units but does not stand up a dev environment or
pass e2e has not yet earned the review station.

### 4. Keep the branch fresh (aggressive rebase)

Whenever the branch is **more than 20 commits behind `origin/develop`**:

- Rebase onto `origin/develop`, resolving conflicts.
- **Run type-check locally before force-pushing.** Rebasing in this repo can
  silently auto-merge files so that tests still pass but type-check breaks
  (e.g. TS2552) — CI would catch it, but checking locally saves a full CI cycle.
- Force-push to **your locked branch on `origin`** (only ever force-push a branch
  you hold the `impl:in-progress` lock on).
- Re-enter step 3 (the rebase re-triggers CI).

### 5. Done — PoC proven, hand off to review

When the PoC is proven (CI green incl. dev-environment build and e2e) and the
branch is fresh:

- Swap labels on the **PR**: remove `impl:in-progress`, add `review:queued`.
- Comment the handoff on the PR.
- Report the PR URL and that it is ready for the agentic review phase
  (`conveyor-review`). The PR stays a **draft** — promoting to "Ready for review" is a
  human's job, after the agentic review is clean.

### 6. Give up — park for a human

Stop and hand back when either:

- 3 fix attempts on the same check have failed, or
- a failure makes clear the **plan itself is wrong** (the approach cannot work as
  specified).

Then:

- Post a PR comment with your diagnosis (which check, what you tried, why it is
  stuck or the plan is wrong) **and the numbered options you see** — e.g.
  (1) try fix approach X, (2) try approach Y, (3) relax constraint Z in the plan,
  (4) bounce back to planning — with your recommendation. The human should be able
  to unblock you by picking a number, not by working out the options themselves.
- Swap labels on the **PR**: remove `impl:in-progress`, add `impl:needs-human`.
- Exit. `impl:needs-human` means hands-off for other agents until a human
  intervenes (fixes it, or bounces the plan back to the planning phase).

## Modes

- **Interactive**: implement, open PR, watch CI live, fix, rebase, hand off.
- **Autonomous** (routine): same core, but between CI runs you sleep and poll
  rather than block; on success set `review:queued`, on stuck set
  `impl:needs-human`. This is the mode meant for burning pooled tokens overnight.

## Rules

- Hold the lock before touching the branch; only force-push a branch you have
  locked. Respect `impl:in-progress` / `impl:needs-human` on other issues.
- Push to `origin` (the upstream repo), never a fork — CI workflows fetch from
  the upstream branch.
- Push frequently so the work is resumable.
- Type-check locally after every rebase before force-pushing.
- Green = green, minus documented broken-in-develop gates. Do not chase flaky or
  pre-existing failures past the escape valves.
- Give up at 3 attempts per check, or immediately if the plan is wrong — never
  loop CI forever.
- Once the PR is open, the issue is the frozen spec; all lifecycle labels and
  working state live on the PR.
- PRs stay drafts — only a human promotes to "Ready for review". This skill
  stops at `review:queued`.
