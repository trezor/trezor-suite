---
name: conveyor-plan-create
description: Turn a feature idea into a well-formed GitHub issue (a feature plan) through forcing questions, then create the issue with a structured body, a status-comment placeholder, and the conveyor/plan:draft label. Use when starting a new feature, beginning planning, or when asked to "create a plan" or "open a plan issue".
---

# conveyor-plan-create

Guide one developer from a raw idea to a `conveyor/plan:draft` GitHub issue that is good
enough to hand to `conveyor-plan-review`. This is the first step of the
[planning workflow](../README.md).

You are an interviewer first and a scribe second. A weak plan in means three
review cycles out; a sharp plan in means the review just confirms it. Spend the
effort here.

**The goal of a plan is a complete feature.** Plan the whole thing — do not
shrink it to fit a small PR. Size is fine: a big change is built and proven as a
proof of concept first, and only later, at the review station, is it split into
shippable pieces if it is too large. Your job is completeness and clear
boundaries (what is and is not part of this feature), not minimalism.

## When to use

- The developer has a feature idea and wants to start the workflow.
- There is no issue yet (if an issue exists, use `conveyor-plan-review` instead).

## Process

### 1. Forcing questions — one at a time

Ask the questions below **one per turn**. Wait for the answer before asking the
next. Push back on vague answers: the first answer is usually polished, the real
constraint shows up in the second. If an answer uses an undefined term
("seamless", "better UX", "faster"), restate it precisely and confirm before
moving on.

Skip a question only if the developer has already answered it clearly in an
earlier turn. If the developer is impatient and the idea is already
well-evidenced, you may collapse to the two highest-leverage open questions
(usually Q3 completeness and Q5 risks) — but never skip all of them.

1. **Problem & who hits it.** What problem does this solve, and who actually hits
   it — which user, in which flow, how often? Reject "would be nice to have";
   look for a concrete person and a concrete moment.
2. **Status quo.** What happens today without this? What is the workaround people
   use now, and why is it bad enough to be worth our time?
3. **The complete feature.** What is the whole feature, done properly? Capture all
   of it — do not shrink it to fit a small PR; size is fine. (Splitting a big
   change into shippable pieces happens later, at the review station.)
4. **Affected surfaces.** Which packages / apps / platforms does this touch
   (e.g. `suite`, `suite-web`, `suite-desktop`, `suite-native`, `connect`,
   `transport`, a `suite-common` package)? Any known coupling or shared code
   that this will ripple into?
5. **Constraints & risks.** Known technical constraints, backward-compatibility
   concerns, and — this is a hardware-wallet codebase — any security, privacy,
   or signing-path implications. What is the most likely way this goes wrong?
6. **Out of scope.** What are we explicitly **not** doing in this plan, so the
   reviewer and implementer do not assume it?

### 2. Search before you create — dedup

Before drafting anything, search for an existing issue or PR covering the same
feature, so you do not open a duplicate:

```bash
gh issue list --state open --search "<feature keywords>"
gh search issues --repo trezor/trezor-suite "<feature keywords>" --state open
gh search prs --repo trezor/trezor-suite "<feature keywords>" --state open
```

If a real match exists, **stop and point the developer at it** instead of
creating a new issue — link the existing issue/PR and suggest running
`conveyor-plan-review` on it (or commenting on the open PR). Only proceed when
you are confident no equivalent plan already exists.

### 3. Optional grounding

If a question hinges on how the code actually works (which package owns a flow,
whether a pattern already exists), do a quick read of the codebase rather than
guessing — but keep it light. Deep architecture analysis is `conveyor-plan-review`'s job,
not yours. Note anything you find as an "Open question" rather than resolving it.

### 4. Draft the plan

Assemble answers into the issue body using exactly this structure. Keep it tight
and concrete — no filler. Leave a section as `_TBD_` only if genuinely unknown,
and add it to Open questions.

```markdown
## Problem
<the problem and who hits it, when, how often>

## Status quo
<what happens today / current workaround>

## Scope
<the complete feature, done properly — all of it; size is fine>

## Affected areas
<packages / apps / platforms, and known coupling>

## Approach
<high-level direction, if known; otherwise "_TBD — for conveyor-plan-review_">

## Out of scope
<explicit non-goals>

## Constraints & risks
<technical constraints, compat, security/privacy/signing implications>

## Acceptance criteria / Definition of done
<a few testable criteria that prove the feature is done, phrased so implementation can write an e2e/integration test against them — observable behaviour, not "code merged". conveyor-implement must land ≥1 new e2e covering these.>

## Open questions
<anything unresolved the review should settle>
```

### 5. Confirm, then create the issue

Show the assembled body to the developer and get a yes before creating anything
on GitHub (creating an issue is outward-facing).

Then create the issue with `gh`:

- **Title:** a concise imperative summary (e.g. "Add X to Y").
- **Body:** the structured plan above.
- **Label:** `conveyor/plan:draft`. (If the label does not exist yet, tell the developer;
  do not silently create labels on the upstream repo.)
- **First comment — the status placeholder.** Immediately post this as the first
  comment so `conveyor-plan-review` has a dashboard to maintain:

```markdown
## 🤖 Plan review status

**State:** draft

### Open decisions (need a human)
_none yet_

### Resolved decisions
_none yet_

### Review lenses
| Lens | Status | Findings |
| --- | --- | --- |
| Scope / product | not run | — |
| Architecture | not run | — |
| Design | n/a until run | — |
| DX | n/a until run | — |

_Last updated by: plan-create_
```

### 6. Hand off

Report the issue URL and tell the developer the next step: anyone with tokens
can run `conveyor-plan-review` on it (`gh issue list --label conveyor/plan:draft` to find it).

## Rules

- One question per turn during the interview. Do **not** batch the forcing
  questions — the friction is the point.
- Search for an existing issue/PR before creating anything; if a match exists,
  point the developer at it rather than opening a duplicate.
- Every plan must carry an `## Acceptance criteria / Definition of done` section
  with testable criteria — never leave it `_TBD_`; this is what implementation
  writes its required new e2e against.
- Never invent product or UX behaviour the developer did not state. If you do not
  know, it is an Open question, not a guess. (No speculative state machines /
  phases / flows.)
- The issue body is the single source of truth from this point on.
- Do not create GitHub labels on the upstream repo without confirmation.
