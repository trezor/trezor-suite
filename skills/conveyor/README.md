# Conveyor — a GitHub-native agentic dev workflow

> **Status: proposal / RFC.** This directory is opened as a draft PR to start a
> team discussion. Where the skills ultimately live (this repo vs. a dedicated
> team-tooling repo) is an open question — see [Open questions](#open-questions).

## Why

We deliver code. Every feature goes through the same four stations:

```
plan  →  implement  →  review  →  test
```

**Conveyor** treats this as an **assembly line**. The product — a feature — moves
down the belt from station to station. At each station an agent does its shift of
work and passes the product to the next station; a human steps onto the line only
at the few stations where human judgement is irreplaceable (taste, architecture,
product decisions, the final review). The scarce, non-scalable resource is
**human attention** — not tokens. The whole design exists to keep the belt moving
with as little human time on it as possible, and to let any worker with spare
tokens take over any station. The skills are prefixed `conveyor-*`.

Two structural ideas make that possible:

1. **All state lives in GitHub.** The plan, the review findings, the open
   decisions, and the lifecycle state are stored on a GitHub issue — never on
   anyone's laptop. This makes the work **stateless across people**: anyone can
   pick up any issue at any point and move it forward.
2. **Token pooling.** Each run executes on a team member's personal Claude
   subscription (via Claude Code / Conductor). Whoever has tokens right now can
   open the board, grab an issue in a state they can advance, and burn tokens on
   it. Later, scheduled **routines** can advance issues autonomously overnight.

GitHub is therefore the shared work queue. Labels are the handoff token.

Each station has a clear goal, and they build on each other:

- **Plan** aims at a **complete feature** — the whole thing, done properly. Size
  is not a constraint here; do not pre-shrink the plan to fit a small PR.
- **Implement** builds that feature and **proves it as a proof of concept**: CI
  stands up a dev environment and the e2e tests pass. A PoC that does not build a
  dev environment or pass e2e has not earned the next station.
- **Review** (and later QA) only begins **after the PoC is proven**. This is also
  where a too-large change is **split** into shippable pieces — so completeness is
  planned and proven first, and broken down second, not the other way around.

## Scope of this proposal

This RFC covers the stations from an idea up to a **review-clean draft PR waiting
for a human's final look**: planning, implementation, and the agentic review
station (Copilot + adversarial second opinion). The human review and test
stations will be designed in follow-ups once these are agreed.

## Data model

One GitHub issue per feature plan.

| Slot | Role | Who writes it |
| --- | --- | --- |
| **Issue body** | The single source of truth: the always-current, consolidated plan. Rewritten in place as the plan evolves. | `conveyor-plan-create`, then `conveyor-plan-review` |
| **Status comment** (first comment) | A living dashboard: lifecycle state, open decisions waiting for a human, resolved decisions, and per-lens review status. Rewritten in place. | `conveyor-plan-create` (placeholder), `conveyor-plan-review` (maintained) |
| **Thread comments** | The working log: each review lens posts its raw findings as its own comment. Append-only, preserves discussion history. | `conveyor-plan-review` lenses + humans |

Rationale: the body is what GitHub surfaces at the top and is the thing an
implementer will read, so it must always be current. The status comment is the
"what now?" dashboard. The thread is the durable history. A single edited
"review comment" would lose history; a pure thread would be noise — this split
gets both.

**Once the PR is open, the belt moves onto the PR.** The linked issue becomes the
**frozen spec** (`Closes #<issue>`) and is no longer updated; from then on all
working state — lifecycle labels, review findings, decisions — lives on the PR,
mirroring the issue model one station back:

| PR slot | Role |
| --- | --- |
| **PR description** | summary of the approach + `Closes #<issue>` |
| **Review status comment** | dashboard: triage, which reviews ran, open findings for a human, resolved findings (+ commit SHA) |
| **Inline review comments** | granular findings (Copilot + adversarial); the durable log |
| **PR labels** | `impl:*` / `review:*` lifecycle |

The PR **branch on `origin`** is the shared implementation state — agents push to
it frequently so any other agent or routine can resume the work if the first runs
out of tokens.

## Lifecycle (labels as a state machine)

Labels live on the **issue** until the PR opens, then on the **PR**.

```
ISSUE                          conveyor-plan-create        conveyor-plan-review
  (idea)──▶ plan:draft ──▶ plan:in-review ──┐
                                            │ parked
                    ┌────────clean──────────┴──────────┐
                    ▼                                   ▼
          plan:ready-to-implement                 plan:needs-human
                    │                          (re-run conveyor-plan-review to drain)
═══════════════════╪═══════ conveyor-implement opens PR; belt moves to the PR ══════
PR                  ▼
             impl:in-progress ──(implement, CI→green, rebase)──┐
                    │                                          │
          ┌─green + fresh──────────────▶ review:queued         │
          └─stuck / plan wrong ────────▶ impl:needs-human      │
                    │ conveyor-review: triage → split? → Copilot + adversarial
                    ▼                                          │
             review:in-progress ───────────────────────────────┘
                    │
          ┌─too big ──────────▶ split proposal ──▶ slices re-enter at conveyor-plan-create ↺
          ├─clean ────────────▶ review:passed ──▶ (human flips draft→ready)
          └─findings parked ──▶ review:needs-human (hands off)
```

| Label | On | Meaning | Next action |
| --- | --- | --- | --- |
| `plan:draft` | issue | Issue created, not yet reviewed | run `conveyor-plan-review` |
| `plan:in-review` | issue | A plan review is in progress | wait / let it finish |
| `plan:needs-human` | issue | Plan decisions parked for a human | run `conveyor-plan-review` to drain |
| `plan:ready-to-implement` | issue | Plan clean, consolidated | hand to `conveyor-implement` |
| `impl:in-progress` | issue→PR | Being implemented now — **active lock** (stale ⇒ takeover) | let it run, or take over if stale |
| `impl:needs-human` | PR | Implementation stuck (CI unbeatable, or the plan is wrong) — **hands-off** | a human fixes it or bounces it to planning |
| `review:queued` | PR | Green draft PR, awaiting agentic review | run `conveyor-review` |
| `review:in-progress` | PR | Agentic review running — **lock** | let it run |
| `review:needs-human` | PR | Review findings parked for a human — **hands-off** | a human resolves them, then re-run `conveyor-review` |
| `review:passed` | PR | Agentic review clean | a human verifies, flips draft→ready, finds a reviewer |

A worker "with tokens" finds an open station by filtering the board:

```bash
gh issue list --label plan:draft               # plans waiting for first review
gh issue list --label plan:needs-human         # plan decisions to drain
gh issue list --label plan:ready-to-implement  # plans waiting to be built
gh pr list --label review:queued               # green PRs waiting for agentic review
gh pr list --label impl:needs-human            # stuck implementations
gh pr list --label review:needs-human          # review findings waiting for a human
```

## The skills

### `conveyor-plan-create`
Interactive. Guides one developer through turning an idea into a well-formed
plan using forcing questions (one at a time, with pushback on vague answers),
then creates the issue: body = structured plan, status comment = placeholder,
label = `plan:draft`. The plan targets the **complete feature** — size is not a
constraint here; splitting is a downstream review concern. See
[conveyor-plan-create/SKILL.md](conveyor-plan-create/SKILL.md).

### `conveyor-plan-review`
Runs multiple independent review lenses (scope/product, architecture, and —
conditionally — design and DX) against the plan. Each lens does full analysis;
mechanical decisions are auto-resolved, only genuine taste decisions and
user-challenges are surfaced to a human. See
[conveyor-plan-review/SKILL.md](conveyor-plan-review/SKILL.md).

It has **two execution modes** sharing one core:

- **Interactive** (human at the keyboard): does the analysis, then presents the
  open decisions as a single batch at a gate. Human decides now; the agent
  records the decisions, consolidates the body, and promotes the label.
- **Autonomous** (routine / overnight): does the same analysis, but instead of
  blocking on a human it **parks** every open decision into the status comment
  and sets `plan:needs-human`, then exits. The next human with tokens drains it.

The only difference between the modes is where the decision gate ends up:
the terminal (live) or GitHub (parked). Human interaction is batched and
minimized by design.

### `conveyor-implement`
Picks up a `plan:ready-to-implement` issue, claims the `impl:in-progress` lock,
implements the complete feature per the consolidated plan, and opens a draft PR
linked with `Closes #<issue>`. The draft's goal is a **proven proof of concept**:
it drives the PR to green and keeps the branch fresh without a human:

- **CI to green — including the PoC gates.** Watches the checks and fixes failures
  it caused. "Green" means green and **explicitly includes the dev-environment
  build and the e2e tests** — a feature that builds units but does not stand up a
  dev environment or pass e2e has not proven its PoC and has not earned the review
  station. Two escape valves keep it from burning tokens on failures that are not
  its to fix: a gate already **broken in `develop`** (verified) is noted and
  ignored; **flaky** checks are rerun a few times. After **3 fix attempts on the
  same check** — or if a failure shows the plan itself is wrong — it parks to
  `impl:needs-human` instead of looping forever.
- **Aggressive rebase.** Whenever the branch is **more than 20 commits behind
  `origin/develop`** it rebases, type-checks locally (this repo can silently
  break type-check on rebase while tests still pass), and force-pushes its locked
  branch.
- **Handoff.** Green + fresh → `review:queued` on the PR. The PR stays a draft.

When the PR opens, it migrates the lock to the PR and stops touching the issue
(now the frozen spec). Same two modes as `conveyor-plan-review`: interactive (watch CI
live) or autonomous (routine polls CI between wakes — the mode meant for burning
pooled tokens overnight). See [conveyor-implement/SKILL.md](conveyor-implement/SKILL.md).

### `conveyor-review`
The agentic review station. Picks up a `review:queued` draft PR and gets it
review-clean while it is still a draft:

- **Triages** the diff (size, risk, splittability) and runs a **split-feasibility
  gate first**: a PR that is too large or bundles independent concerns is hard to
  review and risky to ship, so before any deep review the station proposes a
  concrete split (slices + dependency order). It never auto-splits — a split is a
  user-challenge; on a human's approval each slice **re-enters the line at the
  start** as its own `conveyor-plan-create` issue (lifted off the belt, set back at
  the beginning) and this PR is closed or reduced.
- **Requests GitHub Copilot's review** (async), then — without idling — runs an
  **adversarial second-opinion review** scaled to the triage: one reviewer for a
  small diff, a fan-out per area plus a security pass for a large or
  signing-sensitive one. Reviewers hunt real bugs and breakage, not style.
- **Processes all findings** (Copilot + adversarial) through the same
  classification as `conveyor-plan-review`: auto-fix only high-confidence, low-risk,
  behaviour-preserving findings (commit, push, reply with the SHA, resolve);
  **park** everything else into the review status comment and set
  `review:needs-human`.
- **Hands off** clean work as `review:passed` — but **never promotes the PR to
  "Ready for review"**. That flip is strictly a human's signal: they verify the
  state, flip the draft, and find a second human to do the final review.

Same two modes (interactive / autonomous routine). See
[conveyor-review/SKILL.md](conveyor-review/SKILL.md).

## Design principles (borrowed, adapted)

- **Separate analysis from decision.** Agents always do the full analysis. Only
  *who decides* changes. Mechanical decisions (one clearly-right answer) are made
  by the agent silently. Taste decisions (reasonable people disagree) are made by
  the agent but surfaced. User-challenges (the agent thinks the human's stated
  direction is wrong) are never auto-decided.
- **Batch human interaction.** Never drip questions one per turn during review.
  Collect, then present once.
- **Offer options, never ask the human to invent one.** Whenever the belt parks
  for a human — a taste decision, a user-challenge, a stuck implementation, a
  split proposal — the agent presents the concrete options it already weighed,
  each with its trade-off and a recommendation, as a numbered list. The human's
  job is to **pick a number**, not to design the answer from scratch. The agent
  does the thinking; the human does the deciding. An open-ended "what should I
  do?" is a failure of this station.
- **Gate noise.** Surface review findings at confidence ≥ 6/10; always surface
  anything that blocks (P1), regardless of confidence. State what was examined
  even when nothing was found — no silent skips.
- **Body is truth.** After every resolution, the agent reconsolidates the issue
  body so the latest plan is always the body.

## Open questions

- **Where do these skills ultimately live?** This repo is a good place to attract
  the team's attention, but committing internal workflow tooling to upstream
  `trezor/trezor-suite` long-term is questionable. A dedicated team-tooling repo
  is a likely home.
- **Label namespace.** `plan:*` / `impl:*` / `review:*` proposed; bikeshed welcome.
- **Routine cadence & guardrails** for overnight autonomous runs.
- **Lock staleness window** — how long without a push before `impl:in-progress`
  counts as abandoned and another agent may take over.
- **Rebase threshold** — 20 commits behind `develop` is a starting heuristic;
  each rebase re-triggers a full CI run, so the number trades freshness for cost.
- **Triage thresholds** for `conveyor-review` — the diff sizes that switch between one
  reviewer, a fan-out, and an added security pass, and the size/concern bar that
  triggers a split proposal.
- **Split mechanics** — how a slice is physically carved off the branch when a
  split is approved: re-plan each slice from scratch vs. carve the existing commits
  into new branches. Left open for discussion.
- **Copilot reviewer wiring** — the exact way to request Copilot's review for our
  org, and how reliable / fast its delivery is.
- **Naming / terminology** — the station and label names ("worker", "station",
  `plan:*` / `impl:*` / `review:*`) are open for discussion.
