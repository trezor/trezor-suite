# GitHub-native agentic planning workflow

> **Status: proposal / RFC.** This directory is opened as a draft PR to start a
> team discussion. Where the skills ultimately live (this repo vs. a dedicated
> team-tooling repo) is an open question — see [Open questions](#open-questions).

## Why

We deliver code. Every feature goes through the same four phases:

```
plan  →  implement  →  review  →  test
```

Each phase is a human collaborating with an agent. The scarce, non-scalable
resource is **human attention** — not tokens. The goal of this workflow is to
spend human attention only where human judgement is irreplaceable (taste,
architecture, product decisions) and let agents do everything else, verifiably.

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

## Scope of this proposal

This RFC covers the **planning phase only** — turning an idea into a
`ready-to-implement` issue. The implementation / review / test phases will be
designed in follow-ups once the planning loop is agreed.

## Data model

One GitHub issue per feature plan.

| Slot | Role | Who writes it |
| --- | --- | --- |
| **Issue body** | The single source of truth: the always-current, consolidated plan. Rewritten in place as the plan evolves. | `plan-create`, then `plan-review` |
| **Status comment** (first comment) | A living dashboard: lifecycle state, open decisions waiting for a human, resolved decisions, and per-lens review status. Rewritten in place. | `plan-create` (placeholder), `plan-review` (maintained) |
| **Thread comments** | The working log: each review lens posts its raw findings as its own comment. Append-only, preserves discussion history. | `plan-review` lenses + humans |

Rationale: the body is what GitHub surfaces at the top and is the thing an
implementer will read, so it must always be current. The status comment is the
"what now?" dashboard. The thread is the durable history. A single edited
"review comment" would lose history; a pure thread would be noise — this split
gets both.

## Lifecycle (labels as a state machine)

```
            plan-create                 plan-review                  human drains
   (idea) ───────────────▶ plan:draft ────────────▶ plan:in-review ──┐
                                                                      │
                       ┌──────────────────────────────────────────────┘
                       ▼
            ┌─ all clear ─────────────▶ plan:ready-to-implement
            │
            └─ decisions parked ──────▶ plan:needs-human ──▶ (re-run plan-review to drain)
```

| Label | Meaning | Next action |
| --- | --- | --- |
| `plan:draft` | Issue created, not yet reviewed | run `plan-review` |
| `plan:in-review` | A review run is in progress | wait / let it finish |
| `plan:needs-human` | Agent parked decisions; a human must resolve them | run `plan-review` to drain, or comment decisions |
| `plan:ready-to-implement` | Review clean, plan consolidated | hand to implementation phase |

A team member "with tokens" finds work by filtering the board:

```bash
gh issue list --label plan:draft        # plans waiting for first review
gh issue list --label plan:needs-human  # decisions waiting to be drained
```

## The two skills

### `plan-create`
Interactive. Guides one developer through turning an idea into a well-formed
plan using forcing questions (one at a time, with pushback on vague answers),
then creates the issue: body = structured plan, status comment = placeholder,
label = `plan:draft`. See [plan-create/SKILL.md](plan-create/SKILL.md).

### `plan-review`
Runs multiple independent review lenses (scope/product, architecture, and —
conditionally — design and DX) against the plan. Each lens does full analysis;
mechanical decisions are auto-resolved, only genuine taste decisions and
user-challenges are surfaced to a human. See
[plan-review/SKILL.md](plan-review/SKILL.md).

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

## Design principles (borrowed, adapted)

- **Separate analysis from decision.** Agents always do the full analysis. Only
  *who decides* changes. Mechanical decisions (one clearly-right answer) are made
  by the agent silently. Taste decisions (reasonable people disagree) are made by
  the agent but surfaced. User-challenges (the agent thinks the human's stated
  direction is wrong) are never auto-decided.
- **Batch human interaction.** Never drip questions one per turn during review.
  Collect, then present once.
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
- **Label namespace.** `plan:*` proposed; bikeshed welcome.
- **Routine cadence & guardrails** for overnight autonomous runs.
