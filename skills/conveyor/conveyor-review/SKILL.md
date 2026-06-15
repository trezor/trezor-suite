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
| **Inline review comments** | the granular findings — Copilot's native ones plus your adversarial ones. Resolve a thread by replying with the fixing commit SHA |
| **PR labels** | `review:*` lifecycle (below) |

## When to use

- A PR is labeled `review:queued` and is not `review:in-progress` /
  `review:needs-human`.

## Inputs

- **Target PR.** A passed PR number, or the oldest `review:queued` PR otherwise.
- **Mode.** Interactive (human at keyboard) or autonomous (routine; never blocks).

## Process

### 0. Claim

Set the PR label to `review:in-progress` (the review lock). If the status comment
does not exist yet, create it from the template below.

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

- If the diff is large **and** decomposable into independent slices (heuristic:
  well past what one reviewer can hold in a sitting, or clearly separable
  concerns), produce a concrete **split proposal**: the slices, what each
  delivers, and their dependency order.
- **Never auto-split.** Splitting restructures already-built work, so it is a
  user-challenge. Surface the proposal to a human: write it into the status
  comment and set `review:needs-human`. In autonomous mode, park and exit.
- **On approval, each slice re-enters the line at the start** — lift the slice off
  the belt and set it back at the beginning as its own `conveyor-plan-create`
  issue; this PR is then closed or reduced to the first slice. (How the branch is
  mechanically carved into slices is an open question — see the README.)
- If the PR is not too big, or the human declines the split, continue.

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
  or the spec. Apply it, commit (conventional commit; for a bug in a specific
  earlier commit prefer `--fixup`), push, reply to the finding's thread with the
  commit SHA, and resolve it. Log it under "Resolved" in the status comment.
- **Park** — everything else: taste calls, uncertain findings, risky fixes,
  anything that would change behaviour or contradict the spec. Write it into the
  status comment's "Open findings" with your recommendation. Never auto-apply.

### 7. Maintain the status comment

Keep the review status comment current (template below). It is the human's
one-stop dashboard for "what did the agents find, what did they fix, what is left
for me".

### 8. Hand off

- **Clean** (nothing parked, no unresolved real/security finding): set
  `review:passed`, remove `review:in-progress`. Comment a summary. The PR stays a
  **draft** — a human now verifies and promotes it to "Ready for review".
- **Parked** (open findings remain): set `review:needs-human`, remove
  `review:in-progress`. `review:needs-human` is hands-off for other agents until a
  human resolves the open findings (then re-run `conveyor-review` to continue).

## Status comment template

```markdown
## 🤖 Review status

**State:** in-progress | needs-human | passed
**Triage:** <N files, ~M lines> — risk: low | medium | high (<sensitive areas>)
**Split:** not needed | proposed (see below) — <n slices>

### Split proposal (if any)
1. **<slice>** — <what it delivers> — depends on: <…>

### Open findings (need a human)
1. **<title>** — <file:line> — recommend: <…>. [taste | risky | changes-spec]

### Resolved
- <title> — <file:line> — fixed in <sha> (<source: copilot | adversarial>)

### Reviews run
| Review | Status | Findings |
| --- | --- | --- |
| Copilot | requested / delivered | <n> |
| Adversarial | <n reviewers> | <n> |

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
  user-challenge, so propose it and let a human approve.
- The issue is frozen once the PR exists; write everything to the PR.
- Auto-fix only high-confidence, low-risk, behaviour-preserving findings; park
  everything else.
- Adversarial reviewers hunt bugs and breakage, not style — leave lint/format to
  CI.
- Scale review depth to the triage; never run a single light pass over a large or
  signing-sensitive diff.
- Respect `review:in-progress` / `review:needs-human` on other PRs.
