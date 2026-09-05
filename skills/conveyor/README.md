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
tokens take over any station. The skills are named `conveyor-<N>-<station>`, where
`<N>` is the station's order on the belt (`conveyor-1-plan-create`,
`conveyor-2-plan-review`, `conveyor-3-implement`, `conveyor-4-review`) so the
sequence is unambiguous at a glance.

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

This RFC covers the stations from an idea to a **verified merge**: planning,
implementation, the agentic review station (Copilot + adversarial second opinion),
and — after a human reviews and merges — a post-merge verification station
(`conveyor-5-land`) that confirms the merge did not break the base. The human
review/merge step in the middle stays human-owned; test discipline is woven into
plan/implement/review (acceptance criteria, a new test per feature, regression
tests per fix) rather than a separate station.

## Data model

One GitHub issue per feature plan.

| Slot | Role | Who writes it |
| --- | --- | --- |
| **Issue body** | The single source of truth: the always-current, consolidated plan. Rewritten in place as the plan evolves. | `conveyor-1-plan-create`, then `conveyor-2-plan-review` |
| **Status comment** (first comment) | A living dashboard: lifecycle state, open decisions waiting for a human, resolved decisions, and per-lens review status. Rewritten in place. | `conveyor-1-plan-create` (placeholder), `conveyor-2-plan-review` (maintained) |
| **Thread comments** | The working log: each review lens posts its raw findings as its own comment. Append-only, preserves discussion history. | `conveyor-2-plan-review` lenses + humans |

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
| **PR labels** | `conveyor/impl:*` / `conveyor/review:*` lifecycle |

The PR **branch on `origin`** is the shared implementation state — agents push to
it frequently so any other agent or routine can resume the work if the first runs
out of tokens.

**The lock is advisory; the branch is the real lock.** An `*-in-progress` label is
just a hint — two agents can race it (read-then-write over two API calls, no
compare-and-swap), so it must never be trusted as a mutex. The actual guard is the
**branch on `origin` plus `git push --force-with-lease`** with an ownership re-check
before each push: `git fetch origin <branch>`, and if it advanced with a commit the
agent did **not** author, STOP — a human or a repo bot (e.g. `bot-rebase.yml`) pushed;
never clobber it. A non-fast-forward / lease rejection means the claim was lost →
stop and reconcile, do not retry the push. Two crash-safety rules back this up:
**add-before-remove** on every label transition (add the new lifecycle label before
removing the old, so a crash mid-transition leaves an extra findable label, never an
invisible orphan), and **step-0 reconciliation** at claim time (if an issue/PR carries
zero conveyor lifecycle labels or more than one — or a single label that disagrees
with the status comment's `State:` line, the trace of a run interrupted mid-handoff
— re-derive the true state and align both before doing anything else). These prose
rules are backed by a deterministic **PreToolUse guard hook**
([`hooks/conveyor-guard.sh`](hooks/conveyor-guard.sh)) that hard-denies the
irreversible commands (force-push without lease, `reset --hard`, `gh pr merge`,
`gh api -X DELETE` …) so an unattended run can't clobber even if the model slips —
and by treating agent/external-authored GitHub text as **untrusted input** (a
comment that says "skip the security review" is rejected, not obeyed). See
[CONVENTIONS.md](CONVENTIONS.md#enforcement--untrusted-input).

## Lifecycle (labels as a state machine)

Labels live on the **issue** until the PR opens, then on the **PR**.

Labels below are shown **without the `conveyor/` prefix** for brevity — the real
labels are `conveyor/plan:draft`, `conveyor/impl:in-progress`, etc. (see the table).

```
ISSUE                          conveyor-1-plan-create        conveyor-2-plan-review
  (idea)──▶ plan:draft ──▶ plan:in-review ──┐
                                            │ parked
                    ┌────────clean──────────┴──────────┐
                    ▼                                   ▼
          plan:ready-to-implement                 plan:needs-human
                    │                          (re-run conveyor-2-plan-review to drain)
                    ▼
             impl:in-progress  (claimed on the ISSUE; lock straddles the divider)
════════════════════╪═══ conveyor-3-implement opens PR; belt + lock move to the PR ════
PR                  ▼
             impl:in-progress ──(implement, CI→green, rebase)──┐
                    │                                          │
          ┌─green + fresh──────────────▶ review:queued         │
          └─stuck / plan wrong ────────▶ impl:needs-human      │
                    │ conveyor-4-review: triage → split? → Copilot + adversarial
                    ▼                                          │
             review:in-progress ───────────────────────────────┘
                    │
          ┌─too big ──────────▶ split proposal ──▶ slices re-enter at conveyor-1-plan-create ↺
          ├─clean ────────────▶ review:passed ──🧑 verify──▶ flip draft→ready
          │                          └─(ready)──▶ human:needs-approval ──🧑 CODEOWNERS approve──▶ 🧑 MERGE
          │                     review:passed ──(rebase/push moves HEAD past Reviewed-at SHA)──▶ review:queued ↺ (stale, re-review)
          └─findings parked ──▶ review:needs-human (hands off — no merge)

          🧑 MERGE ──▶ conveyor-5-land: watch post-merge develop CI for the merge commit
          ┌─green ────────────────────▶ land:verified ✅
          └─broke develop ────────────▶ land:broke-develop ──▶ land:needs-human (revert / forward-fix / flake)
```

| Label | On | Meaning | Next action |
| --- | --- | --- | --- |
| `conveyor/plan:draft` | issue | Issue created, not yet reviewed | run `conveyor-2-plan-review` |
| `conveyor/plan:in-review` | issue | A plan review is in progress | wait / let it finish |
| `conveyor/plan:needs-human` | issue | Plan decisions parked for a human | run `conveyor-2-plan-review` to drain |
| `conveyor/plan:ready-to-implement` | issue | Plan clean, consolidated | hand to `conveyor-3-implement` |
| `conveyor/impl:in-progress` | issue→PR | Being implemented now — **advisory lock**; real lock is the branch + force-with-lease (stale ⇒ takeover) | let it run, or take over if stale |
| `conveyor/impl:needs-human` | PR | Implementation stuck (CI unbeatable, or the plan is wrong) — **hands-off** | a human fixes it or bounces it to planning |
| `conveyor/review:queued` | PR | Green draft PR, awaiting agentic review | run `conveyor-4-review` |
| `conveyor/review:in-progress` | PR | Agentic review running — **advisory lock**; real lock is the branch + force-with-lease (stale ⇒ takeover) | let it run, or take over if stale |
| `conveyor/review:needs-human` | PR | Review findings parked for a human — **hands-off** | a human resolves them, then re-run `conveyor-4-review` |
| `conveyor/review:passed` | PR (draft) | Agentic review clean (vouches for the `Reviewed at:` SHA), still a draft | a human verifies and flips draft→ready — that flip hands off to human review |
| `conveyor/human:needs-approval` | PR (ready) | Promoted to ready; awaiting the required human approval (the author cannot self-approve) | CODEOWNERS auto-requests the owning reviewer (belt requests the `## Team` reviewer if none match); a human approves and merges |
| `conveyor/land:watching` | PR (merged) | Watching the post-merge `develop` CI for the merge commit | let `conveyor-5-land` finish |
| `conveyor/land:verified` | PR (merged) | Merge did not break `develop` | done — belt complete |
| `conveyor/land:broke-develop` | PR (merged) | Merge broke the base branch | a human picks revert / forward-fix / flake |
| `conveyor/land:needs-human` | PR (merged) | Post-merge decision parked — **hands-off** | drain `conveyor-5-land` after ticking |

**Label bootstrap (one-time).** The board is empty on day one until the lifecycle
labels exist. Create them once per repo:

```bash
# The conveyor/ prefix groups them as one family; shared colours make them pop.
mk(){ gh label create "$1" --color "$2" --description "Conveyor: $3" --force; }
mk conveyor/plan:draft              1f6feb "plan created, awaiting review"
mk conveyor/plan:in-review          1f6feb "plan review in progress"
mk conveyor/plan:needs-human        cf222e "plan decisions parked for a human"
mk conveyor/plan:ready-to-implement 1f6feb "plan clean, ready to build"
mk conveyor/impl:in-progress        d29922 "being implemented (advisory lock)"
mk conveyor/impl:needs-human        cf222e "implementation stuck, needs a human"
mk conveyor/review:queued           2da44e "green draft PR, awaiting agentic review"
mk conveyor/review:in-progress      2da44e "agentic review running"
mk conveyor/review:needs-human      cf222e "review findings parked for a human"
mk conveyor/review:passed           2da44e "agentic review clean, human takes over"
mk conveyor/human:needs-approval    cf222e "ready PR, awaiting the required human approval"
mk conveyor/land:watching           006b75 "watching post-merge develop CI"
mk conveyor/land:verified           0e8a16 "merge did not break develop"
mk conveyor/land:broke-develop      cf222e "merge broke the base branch"
mk conveyor/land:needs-human        cf222e "post-merge decision parked for a human"
mk conveyor:meta                    6f42c1 "workflow friction / skill-improvement item"
```

Colours: `plan:*` blue, `impl:*` amber, `review:*` green, every park that needs a
human (`*:needs-human` and `human:needs-approval`) red so it stands out at a glance;
`conveyor:meta` purple (it is
not a lifecycle label — it tags [feedback](#feedback-loop--improving-conveyor-from-use) issues about the workflow itself).

Each skill **preflight-checks** that these labels exist before it queries or writes
the board. If any are missing it **stops and asks a human to run the bootstrap
above** — it does **not** create labels itself (creating labels on the upstream
repo is a deliberate, human-confirmed step). That way a fresh repo never silently
yields an empty board, and no agent invents labels on its own.

A worker "with tokens" finds an open station by filtering the board:

```bash
gh issue list --label conveyor/plan:draft               # plans waiting for first review
gh issue list --label conveyor/plan:needs-human         # plan decisions to drain
gh issue list --label conveyor/plan:ready-to-implement  # plans waiting to be built
gh issue list --label conveyor/plan:in-review           # plan reviews in flight (check for stale takeover)
gh issue list --label conveyor/impl:in-progress         # claimed but not yet on a PR (check for stale)
gh pr list --label conveyor/impl:in-progress            # in-flight implementations (check for stale)
gh pr list --label conveyor/review:queued               # green PRs waiting for agentic review
gh pr list --label conveyor/review:in-progress          # agentic reviews in flight (check for stale takeover)
gh pr list --label conveyor/impl:needs-human            # stuck implementations
gh pr list --label conveyor/review:needs-human          # review findings waiting for a human
```

**The whole board in the browser.** GitHub label search has no glob (`conveyor/*`),
so the URL lists every conveyor label OR-ed (a comma inside one `label:` qualifier =
OR; it returns issues **and** PRs, all states). Update it if you add a label:

```
https://github.com/trezor/trezor-suite/issues?q=label%3A%22conveyor%2Fplan%3Adraft%22%2C%22conveyor%2Fplan%3Ain-review%22%2C%22conveyor%2Fplan%3Aneeds-human%22%2C%22conveyor%2Fplan%3Aready-to-implement%22%2C%22conveyor%2Fimpl%3Ain-progress%22%2C%22conveyor%2Fimpl%3Aneeds-human%22%2C%22conveyor%2Freview%3Aqueued%22%2C%22conveyor%2Freview%3Ain-progress%22%2C%22conveyor%2Freview%3Aneeds-human%22%2C%22conveyor%2Freview%3Apassed%22%2C%22conveyor%2Fhuman%3Aneeds-approval%22%2C%22conveyor%2Fland%3Awatching%22%2C%22conveyor%2Fland%3Averified%22%2C%22conveyor%2Fland%3Abroke-develop%22%2C%22conveyor%2Fland%3Aneeds-human%22%2C%22conveyor%3Ameta%22
```

To find **orphans** — issues/PRs carrying NONE of the conveyor lifecycle labels (a
crash dropped the last label, or an item never entered the line) — query the
negative space and reconcile (step-0) anything that turns up:

```bash
gh issue list --search 'is:open -label:"conveyor/plan:draft" -label:"conveyor/plan:in-review" -label:"conveyor/plan:needs-human" -label:"conveyor/plan:ready-to-implement" -label:"conveyor/impl:in-progress"'
gh pr list    --search 'is:open draft:true -label:"conveyor/impl:in-progress" -label:"conveyor/impl:needs-human" -label:"conveyor/review:queued" -label:"conveyor/review:in-progress" -label:"conveyor/review:needs-human" -label:"conveyor/review:passed"'
```

**Resume path for parked items.** A `*-needs-human` item is not a dead end: the
human **ticks the answer checkboxes** in the status comment (async, in the GitHub
web UI) and ticks the `✅ Done` box; the same skill is then re-run in **drain mode**
— manually, or by a scheduled routine — which reads the ticked state and moves the
belt on. (A routine that periodically drains every `*-needs-human` item whose Done
box is ticked is the hands-off "tick it whenever, the agent picks it up" loop.)
Because nothing chases these instantly, parked items also want an **age /
escalation** query so a branch can't rot silently — periodically sort the
`*-needs-human` queries by age and escalate the oldest:

```bash
gh issue list --label conveyor/plan:needs-human --json number,title,updatedAt --jq 'sort_by(.updatedAt)'
gh pr list    --label conveyor/review:needs-human --json number,title,updatedAt --jq 'sort_by(.updatedAt)'
```

## Routines — hands-off draining (the overnight loop)

The async-checkbox model lets a human tick answers whenever they like. A
**routine** closes the loop: it periodically picks up the items the human has
finished answering and drains them, so the belt keeps moving with no one at a
keyboard. This is the "tick it whenever, the agent picks it up" path (layer B1).

A routine is a **scheduled agent**, not a plain shell script — the actual drain is
an agent running a conveyor skill. The shell only does the read-only *filter*:
[`routines/conveyor-ready.sh`](routines/conveyor-ready.sh) lists every
`*:needs-human` item whose `✅ Done` box is ticked. Test it standalone first:

```bash
REPO=mroz22/conveyor-sandbox ./skills/conveyor/routines/conveyor-ready.sh
# plan:1      (issue 1, ready)   -> conveyor-2-plan-review
# review:7    (PR 7, ready)      -> conveyor-4-review
```

The routine's agent runs that filter, then drains each printed item with the
matching skill. The driver prompt it runs each tick:

```text
Run: REPO=mroz22/conveyor-sandbox ./skills/conveyor/routines/conveyor-ready.sh
For each printed `kind:number`, run the matching conveyor drain skill, autonomous mode:
  plan:N   -> conveyor-2-plan-review on issue N
  impl:N   -> conveyor-3-implement on PR N
  review:N -> conveyor-4-review on PR N
Process at most 5 items this run. If none are ready, exit. Stop if you hit your token budget.
```

Schedule it either way:

- **Claude Code / Conductor routine** (`/schedule`): create a routine with the
  driver prompt above on a cron (e.g. every 30 min, or nightly) — it runs on the
  team member's own subscription.
- **Plain cron + headless CLI** (once headless auth is set up):
  `*/30 * * * * cd <repo> && claude -p "<driver prompt>"`.

Guardrails:

- **Whose tokens:** the member who enabled the routine — the overnight
  token-pooling model. Several members can run their own; the locks keep them from
  colliding.
- **Only Done-ticked items** are touched; a half-ticked decision is left waiting.
- **Bounded per run** (the "at most 5" + token budget) so a backlog can't drain
  the whole pool in one tick.
- **Safe to crash:** the drain skills are idempotent (step-0 reconciliation,
  add-before-remove), so a routine dying mid-drain leaves a findable state, not a
  corrupt one.
- This is **layer B1** (poll). The instant, event-driven version (a GitHub Action
  firing on the checkbox edit) is deliberately **not** built — it clashes with
  running on personal subscriptions, and a frequent poll gets you ~the same thing.

## Team — who owns the human gates

Conveyor keeps the *stations* poolable (any worker's tokens do the agent work), but
for a given feature it **assembles a team** of the humans accountable at the few
**human gates**. Roles map to gates, not to agent stations:

| Role | Owns | When assigned |
| --- | --- | --- |
| **Product owner** | the spec + plan decisions | always — it is the **issue creator** (set at `conveyor-1-plan-create`) |
| **Reviewer** | the required single approval at the PR | **resolved at the PR handoff** (CODEOWNERS-primary); **non-blocking** for the plan — plan review only pins a fallback from CODEOWNERS |
| **Eng owner** | the technical approach; pulled in when implementation parks to `impl:needs-human` | optional — only for large / architecturally significant changes |
| **Tester** | the test/QA sign-off (future station) | optional — only when there is a real test/QA surface |

The team is **assembled during `conveyor-2-plan-review`** (at the promote gate, once
the scope and size are known), scaled to the plan: small stays near-fungible (the
creator + one reviewer), large pulls in specialists. The agent proposes from a
roster and the human confirms via the same async checkboxes; eng owner and tester
are optional decisions.

- **Candidate source:** the optional roster `.github/conveyor-team.yml` (people → roles
  `product|eng|review|qa` → areas), else **CODEOWNERS** as the repo's de-facto roster
  (owners of the Affected areas, or the nearest parent path's, minus the author), else
  ask the human. The **Reviewer is non-blocking** — branch protection + CODEOWNERS
  enforce the real approval at the PR; plan review only pins a fallback (set the issue
  Assignee when CODEOWNERS won't cover the area).
  See [`conveyor-team.example.yml`](conveyor-team.example.yml).
- **Recorded** in a `## Team` block in the issue body, carried onto the PR.
- **No early pings:** handles are stored **without a leading `@`** so nobody is
  notified up front. Each person is only actually requested/`@`-mentioned **at their
  own gate** — the eng owner when implementation stalls, the reviewer at the
  human-review handoff (below), the tester at the test station.

**The human-review handoff (draft→ready).** Conveyor never requests a human reviewer
during the agentic phase. The reviewer gate opens only when a human verifies the clean
`conveyor/review:passed` draft and **flips it to "Ready for review"**. At that flip the
PR moves to `conveyor/human:needs-approval`, and **GitHub CODEOWNERS** auto-requests the
owning reviewer — the required single approval, which the author cannot give. CODEOWNERS
is the primary path (native, instant, free). When no CODEOWNERS entry matches the changed
files, the **belt routine** backstops it on its next sweep by requesting the `## Team`
reviewer (skipping the author). The label swap and the note are done by the
`conveyor-human-handoff` GitHub Action — a template in
[`workflows/`](workflows/conveyor-human-handoff.yml), installed as its own small PR; it is
pure GitHub mechanics (no agent, no tokens, so it never touches the routine run budget).
**Until that Action is installed, the belt does the swap itself:** its human-review step
detects a `conveyor/review:passed` PR that is **no longer a draft** (Conveyor PRs open as
drafts, so not-draft means a human flipped it) and performs the same handoff — relabel to
`conveyor/human:needs-approval` plus the reviewer backstop. So the flip is never stranded,
Action or not; a human never touches a `conveyor/*` label.

## Feedback loop — improving Conveyor from use

Conveyor is itself a versioned project, so it improves the same way it ships
features: friction is **captured cheaply in the moment** and **drained into gated
skill changes** — agents propose, a human approves at the PR gate. Three layers:

- **L1 — capture (automatic).** When a skill gets in the way *during a run* — a rule
  is wrong / missing / ambiguous, a step misfired, output needed hand-fixing — the
  agent records it (see [CONVENTIONS.md](CONVENTIONS.md#improving-the-workflow-friction-capture)):
  an **obvious tooling fix** becomes a small skill-fix PR right away; anything
  **debatable** becomes a **`conveyor:meta` issue** filed against the *conveyor home
  repo* (not the product repo). You can file one by hand too, but the point is the
  agent does it without anyone having to remember.
- **L2 — triage (gated).** A `conveyor-improve` step (a skill or an overnight
  routine, *to be built*) reads the open `conveyor:meta` queue + recent runs,
  clusters recurring friction, and proposes skill edits **as a PR** — never
  auto-applied. A human approves at the gate.
- **L3 — dogfood.** Substantial changes (a new station, a phase redesign) become
  `conveyor:meta` plan-issues that run through the pipeline itself.

The non-negotiable: **friction capture is automatic and low-risk; skill *edits* are
always human-gated**, so the workflow can't silently drift.

Conveyor compounds along a second axis too — **project learnings**. The product repo
keeps a versioned `.github/conveyor-learnings.md` (codebase gotchas, recurring bug
classes, package quirks) that stations **load** before working and **append to
inside the implementation PR**, so each learning is human-reviewed at the merge gate
before it is trusted — the merge is the promotion event (no per-use counter), with
confidence-decay for unconfirmed agent entries and GC for stale/contradictory ones.
This turns each station from cold-start into compounding memory. See
[CONVENTIONS.md](CONVENTIONS.md#project-learnings) and
[`conveyor-learnings.example.md`](conveyor-learnings.example.md).

## The skills

Five belt stations (`conveyor-1-plan-create` → `…-2-plan-review` → `…-3-implement` →
`…-4-review` → human review/merge → `…-5-land`) plus the `conveyor-sync` utility. All
follow the shared [house rules](CONVENTIONS.md) — English-only and no-hard-wrap GitHub
writing, advisory-lock / `--force-with-lease`, add-before-remove + reconciliation,
async checkboxes, the security carve-out, team handles without `@`, project learnings,
the guard hook + untrusted-input rule — stated once in `CONVENTIONS.md` so a
cross-cutting rule is a one-file change. Each skill adds only its station-specific
rules.

### `conveyor-1-plan-create`
Interactive. Guides one developer through turning an idea into a well-formed
plan using forcing questions (one at a time, with pushback on vague answers),
then creates the issue: body = structured plan, status comment = placeholder,
label = `conveyor/plan:draft`. The plan targets the **complete feature** — size is not a
constraint here; splitting is a downstream review concern. See
[conveyor-1-plan-create/SKILL.md](conveyor-1-plan-create/SKILL.md).

### `conveyor-2-plan-review`
Runs multiple independent review lenses (scope/product, architecture, and —
conditionally — design and DX) against the plan. Each lens does full analysis;
mechanical decisions are auto-resolved, only genuine taste decisions and
user-challenges are surfaced to a human. See
[conveyor-2-plan-review/SKILL.md](conveyor-2-plan-review/SKILL.md).

It has **two execution modes** sharing one core:

- **Interactive** (human at the keyboard): does the analysis, then presents the
  open decisions as a single batch at a gate. Human decides now; the agent
  records the decisions, consolidates the body, and promotes the label.
- **Autonomous** (routine / overnight): does the same analysis, but instead of
  blocking on a human it **parks** every open decision into the status comment
  and sets `conveyor/plan:needs-human`, then exits. The next human with tokens drains it.

The only difference between the modes is where the decision gate ends up:
the terminal (live) or GitHub (parked). Human interaction is batched and
minimized by design.

### `conveyor-3-implement`
Picks up a `conveyor/plan:ready-to-implement` issue, claims the `conveyor/impl:in-progress` lock,
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
  `conveyor/impl:needs-human` instead of looping forever.
- **Aggressive rebase.** Whenever the branch is **more than 20 commits behind
  `origin/develop`** it rebases, type-checks locally (this repo can silently
  break type-check on rebase while tests still pass), and force-pushes its locked
  branch.
- **Handoff.** Green + fresh → `conveyor/review:queued` on the PR. The PR stays a draft.

When the PR opens, it migrates the lock to the PR and stops touching the issue
(now the frozen spec). Same two modes as `conveyor-2-plan-review`: interactive (watch CI
live) or autonomous (routine polls CI between wakes — the mode meant for burning
pooled tokens overnight). See [conveyor-3-implement/SKILL.md](conveyor-3-implement/SKILL.md).

### `conveyor-4-review`
The agentic review station. Picks up a `conveyor/review:queued` draft PR and gets it
review-clean while it is still a draft:

- **Triages** the diff (size, risk, splittability) and runs a **split-feasibility
  gate first**: a PR that is too large or bundles independent concerns is hard to
  review and risky to ship, so before any deep review the station proposes a
  concrete split (slices + dependency order). It never auto-splits — a split is a
  user-challenge; on a human's approval each slice **re-enters the line at the
  start** as its own `conveyor-1-plan-create` issue (lifted off the belt, set back at
  the beginning) and this PR is closed or reduced.
- **Requests GitHub Copilot's review** (async), then — without idling — runs an
  **adversarial second-opinion review** scaled to the triage: one reviewer for a
  small diff, a fan-out per area plus a security pass for a large or
  signing-sensitive one. Reviewers hunt real bugs and breakage, not style.
- **Processes all findings** (Copilot + adversarial) through the same
  classification as `conveyor-2-plan-review`: auto-fix only high-confidence, low-risk,
  behaviour-preserving findings (commit, push, reply with the SHA, resolve);
  **park** everything else into the review status comment and set
  `conveyor/review:needs-human`.
- **Hands off** clean work as `conveyor/review:passed` — but **never promotes the PR to
  "Ready for review"**. That flip is strictly a human's signal: they verify the
  state, flip the draft, and find a second human to do the final review.

It also **records the reviewed SHA**; if the branch later moves past it (a rebase or
a human push), the review is **stale** and is re-opened rather than merged as-is.
Same two modes (interactive / autonomous routine). See
[conveyor-4-review/SKILL.md](conveyor-4-review/SKILL.md).

### `conveyor-5-land`
The **post-merge verification** station. A human reviews and **merges** the PR (that
step stays human-owned); `conveyor-5-land` then watches the post-merge `develop` CI
for the merge commit, because a PR that was green can still break the base after
merge (rebase/interaction — a failure mode this repo has hit). Green (minus
already-broken-in-develop checks, and ignoring single flakes) → `conveyor/land:verified`,
the belt is complete. Broke the base → `conveyor/land:broke-develop`, it `@`-mentions
the Team eng owner (their gate) and **parks a checkbox**: revert / forward-fix /
flake-rerun. Same two modes. See [conveyor-5-land/SKILL.md](conveyor-5-land/SKILL.md).

## Design principles (borrowed, adapted)

- **Separate analysis from decision.** Agents always do the full analysis. Only
  *who decides* changes. Mechanical decisions (one clearly-right answer) are made
  by the agent silently. Taste decisions (reasonable people disagree) are made by
  the agent but surfaced. User-challenges (the agent thinks the human's stated
  direction is wrong) are never auto-decided.
- **Find out before you ask.** Never ask the human anything you can determine
  yourself by reading the code, git history, or the report — callers, affected
  packages, how a path behaves, how often it fires. Investigate first; put to the
  human only what is genuinely human-only (intent, priorities, scope, unobservable
  context). For a bug, lead with investigation, not interrogation. Asking the human
  an investigable fact wastes the one resource Conveyor exists to protect.
- **Batch human interaction.** Never drip questions one per turn during review.
  Collect, then present once.
- **Offer options, never ask the human to invent one — answered async via
  checkboxes.** Whenever the belt parks for a human — a taste decision, a
  user-challenge, a stuck implementation, a split proposal — the agent presents the
  concrete options it already weighed, each with its trade-off and a
  recommendation, as a **GitHub task-list checkbox** in the status comment, under a
  single `✅ Done — agent, pick this up` box. The human **ticks a box in the GitHub
  web UI** (from a laptop or a phone, no agent running), then ticks Done. The next
  run of the skill — manual, or a routine — **drains** the parked item: it reads the
  ticked state (exactly one box per item = the choice; none = the recommended
  option; Done unticked = still waiting) and continues. **Ticking alone changes
nothing — re-run the same skill that parked it (e.g. `conveyor-2-plan-review`),
not the next station like `conveyor-3-implement`, to drain. Asking the human to
re-answer in chat what they already ticked, or a next-station skill refusing a
ticked-but-not-drained plan instead of pointing at the drain, are bugs.** The
human's job is to tick,
  not to design the answer from scratch; an open-ended "what should I do?" is a
  failure of this station.
- **Gate noise.** Surface review findings at confidence ≥ 6/10; always surface
  anything that blocks (P1), regardless of confidence. State what was examined
  even when nothing was found — no silent skips.
- **Body is truth.** After every resolution, the agent reconsolidates the issue
  body so the latest plan is always the body.

## Distribution

The skills' home is **`trezor/trezor-suite`**, path `skills/conveyor/` — the same
repo the team works in and where `conveyor:meta` improvement issues land. A worker
makes them invocable on their machine with **[`conveyor-sync`](conveyor-sync/SKILL.md)**:
it resolves the latest `skills/conveyor` commit on the home repo, atomically
installs each `conveyor-*` skill (plus the shared `CONVENTIONS.md` / `README.md`,
which the flattened install needs alongside) with move-to-`.bak` + restore-on-
failure, and records the synced SHA. Skill **edits** never happen through sync —
they are human-gated PRs to the home repo (per the feedback loop); `conveyor-sync`
only distributes approved skills. A schema change (a label rename, a status-comment
format) ships an idempotent script under `skills/conveyor/migrations/` that
`conveyor-sync` runs to sweep the board and rewrite in-flight items — the on-board
analogue of a database migration, so the workflow can evolve while teammates already
have live work on the belt. Each station also does a throttled update-check at start
and nudges `/conveyor-sync` when behind (see [CONVENTIONS.md](CONVENTIONS.md#staying-current)).

## Open questions

- **Label namespace.** `conveyor/plan:*` / `conveyor/impl:*` / `conveyor/review:*` proposed; bikeshed welcome.
- **Routine cadence & guardrails** for overnight autonomous runs.
- **Lock staleness window** — how long without a push before `conveyor/impl:in-progress`
  counts as abandoned and another agent may take over. Fencing is now in place
  (`git push --force-with-lease` + an ownership re-check before each push), so a
  wrong guess here **fails loudly** — a premature takeover loses the lease and stops
  rather than destroying the other worker's commits — but the window still wants tuning.
- **Rebase threshold** — 20 commits behind `develop` is a starting heuristic;
  each rebase re-triggers a full CI run, so the number trades freshness for cost.
- **Triage thresholds** for `conveyor-4-review` — the diff sizes that switch between one
  reviewer, a fan-out, and an added security pass, and the size/concern bar that
  triggers a split proposal. The split trigger now has a concrete starting bar
  (>~800 changed lines **or** >15 files, **and** ≥2 independent concerns that share
  no symbols — see `conveyor-4-review`); the open question is to **tune those numbers**
  against real PRs, not whether a bar exists.
- **Split mechanics** — how a slice is physically carved off the branch when a
  split is approved: re-plan each slice from scratch vs. carve the existing commits
  into new branches. Left open for discussion.
- **Copilot reviewer wiring** — the exact way to request Copilot's review for our
  org, and how reliable / fast its delivery is.
- **Naming / terminology** — the station and label names ("worker", "station",
  `conveyor/plan:*` / `conveyor/impl:*` / `conveyor/review:*`) are open for discussion.

## Known gaps — hardening before autonomous runs

Lower-priority gaps not yet fixed in the skills, listed so they stay tracked:

- **Advisory `continue-on-error` CI checks.** Some per-PR checks are advisory and never fail the run, so gating must read each check's **conclusion**, not the presence of a red line in a log.
- **e2e is paths-ignore-gated and platform-specific.** An absent e2e job on a surface the PR doesn't touch is a valid green, not a missing gate — don't treat "no e2e ran" as failure on an unaffected surface.
- **`broken-in-develop` can't be reproduced locally for e2e / dev-env.** Verify that bucket by reading the latest `develop` / nightly CI run instead of running it locally, and bootstrap the workspace first (`git submodule update --init`, `yarn install`) so submodule-absent errors aren't misread as PR breakage.
- **PR template.** The draft PR should start from the repo's `pull_request_template.md` (including the **Notes for QA** section), not a hand-rolled body.
- **Two classifiers, two thresholds.** `conveyor-2-plan-review` and `conveyor-4-review` share the same classification **structure** but use different numeric thresholds (surface at ≥6 confidence; auto-fix only at ≥8) — don't unify the numbers by accident.
- **Build-big-then-split cost.** A large feature pays one full implement + e2e cycle **before** the split decision is taken at review, so the first slice's proof work is partly redone — accepted for now, flagged as a cost.
