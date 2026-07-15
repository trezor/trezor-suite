# Autonomous Nightly Test Fix Agent — Design Summary

---

## Goal

A fully automated system that runs after nightly tests, analyzes failures, implements fixes, and iterates until tests pass. Delivers a PR with fixed tests and full audit trail for anything it couldn't fix.

---

## Overall Architecture

Source code in `packages/e2e-utils/src/fixBot`. A single GitHub Actions workflow, `.github/workflows/test-suite-nightly-fix-agent.yml`, is the orchestrator:

```
analyze        → downloads ledger.json (S3), harness writes report.json + report.md
prepare-matrix → builds a job matrix from report.json fixTasks
build-web, build-desktop
fix [matrix]   → one job per fix task (parallel):
                 Fix Agent loop → harness writes fix-result.json,
                 agent writes pr-description.md → publish: push branch + gh pr create
notify         → Slack summary from downloaded artifacts
update-ledger  → rebuild ledger.json from run outcomes, upload to S3
aggregate      → LLM usage dashboard
```

### Fix Agent Output Contract

The harness captures each agent's structured JSON final answer (validated by `--json-schema`) and writes it to disk — the agents never write JSON themselves:

- **`fix-result.json`** — fix result, written by `fix.ts`:
    ```json
    {
        "taskId": "fix-001",
        "result": "pass | partial | fail | not_duplicated",
        "passed": ["web/T3W1/suite/e2e/tests/wallet/send.ts"],
        "failed": [],
        "iterations": 2,
        "prTitle": "Nightly fix 26-05-19 - send-button locator"
    }
    ```
- **`pr-description.md`** — written by the agent, passed to `gh pr create --body-file`

Neither file is committed. Each matrix job is self-contained: run agent → `publish.ts` reads the files → push branch → create PR. The `notify` job reads `report.json` and the uploaded `slack-fix-summary-*.json` artifacts; it never touches the branch checkout.

## Phase 1: Analysis Agent

---

Prompt: `ANALYSIS_AGENT.md` (self-contained, Steps 1–8). Steps 1–6 diagnose each failure; Step 7 clusters failures by shared root cause into **fix tasks**; Step 8 returns the structured report. The analysis agent has Currents MCP access (`mcp.json`); the fix agent does not.

**Outputs:** `report.md` (written by the agent, Step 6) and `report.json` (harness-captured structured output, Step 8).

### Failure Classification

| Value            | Meaning                                                  | Routing               |
| ---------------- | -------------------------------------------------------- | --------------------- |
| `FIXABLE`        | Resolvable with test changes and/or adding `data-testid` | → **fix_task**        |
| `PRODUCT_BUG`    | Product logic/behavior must change                       | → **skipped** (human) |
| `INFRASTRUCTURE` | CI/environment issue                                     | → **skipped** (human) |

The fix agent has one allowed change surface for every task: any file under `suite/e2e/` plus
`data-testid` attributes in product source. No other product code changes. It decides the remedy
(e.g. update the test to an existing/renamed locator vs. add a new `data-testid`).

### Confidence → Iteration Budget

| Confidence                       | Max iterations |
| -------------------------------- | -------------- |
| `HIGH`                           | 3              |
| `MEDIUM`                         | 2              |
| `LOW`                            | 1              |
| `PRODUCT_BUG` / `INFRASTRUCTURE` | 0 — skipped    |

`{
  "runDate": "2026-04-23",
  "webRunId": "...",
  "desktopRunId": "...",
  "fixTasks": [
    {
      "id": "fix-001",
      "branch": "fix/nightly-2026-04-23-send-button-locator",
      "rootCause": "send-button data-testid renamed in SendForm component",
      "confidence": "HIGH",
      "analysis": "<MD prose for the tests in this fix task — what is broken: error messages, stack traces, visual evidence, root cause reasoning>",
      "validations": [
        { "platform": "web",     "group": "T3W1", "spec": "suite/e2e/tests/wallet/send.ts" },
        { "platform": "web",     "group": "T3T1", "spec": "suite/e2e/tests/wallet/send.ts" },
        { "platform": "desktop", "group": "T3W1", "spec": "suite/e2e/tests/wallet/send.ts" },
        { "platform": "desktop", "group": "T3T1", "spec": "suite/e2e/tests/wallet/send.ts" },
        { "platform": "web",     "group": "T3W1", "spec": "suite/e2e/tests/wallet/send-advanced.ts" }
      ]
    }
  ],
  "skipped": [
    {
      "rootCause": "...",
      "reason": "PRODUCT_BUG",
      "validations": [
        { "platform": "desktop", "group": "T1B1", "spec": "suite/e2e/tests/firmware/update.ts" }
      ]
    }
  ]
}`

`validations` covers **every** affected platform/group/spec combination — no deduplication. The `analysis` field contains the relevant MD prose written by the analysis agent at clustering time, so each fix agent receives exactly the context it needs without touching other fix tasks.

## **Deduplication**

Fix tasks are grouped by root cause, not by test or platform. The agent judges which failures share the same underlying problem — errors may differ in wording across platforms or tests and still point to the same fix. Validations cover all affected specs on all affected platforms. When the same test fails across multiple device groups for the same reason, one canonical group per platform is sufficient to validate.

---

## Phase 2: Fix Agent (per fix task)

One Claude Code invocation per fix task. Receives a single fix task entry from `report.json`.

### Loop

```
Setup environment (web preview server (pre-built static) / build electron app / emulator)
Pre-flight run: playwright test <spec> for each validation
  → confirms failure is real
  → produces fresh local trace + screenshots
Fix agent reads the trace via the playwright-trace skill (trace CLI) when it needs context
Loop:
  modify code
  rebuild electron and/or web app if needed
  run validations
  read the new trace via the trace CLI if needed
  iterate
```

Fix constraints

- May only change test files and `data-testid` attributes in product components
- Must run ALL validations listed in the fix task
- A fix task is "done" when every validation passes or the iteration budget is exhausted

---

## Commit and PR Logic

### Per iteration

Every iteration commits locally. First iteration is a regular commit, subsequent ones are `--fixup`.

- First commit: generic message, e.g. `test(e2e): fix send-button locator` — save its SHA
- Subsequent iterations: `git commit --fixup <SHA of the iteration-1 commit>` (no custom message, auto-generated)

| Result         | Action                                      |
| -------------- | ------------------------------------------- |
| All pass       | Push branch, create PR ✅                   |
| Some pass      | Push branch, create PR ⚠️                   |
| Zero pass      | Summary artifact only — no branch pushed ❌ |
| Not duplicated | Summary artifact only — no branch pushed 🔵 |

### Git strategy

- One branch and worktree per fix task, name prepared by the analysis agent and included in `report.json` as `branch`: `fix/nightly-YYYY-MM-DD-<root-cause-slug>`
- PRs are created only when ≥1 validation passes
- PR is assigned to the **QA and Test Automation** GitHub project (org project #78)

### PR description

The fix agent writes a per-task `pr-description.md` covering: root cause, fix applied, a validation status table (✅/❌ per platform/group/spec), the commit log, and any prompt gaps encountered. `publish.ts` appends an Agent cost section. See `FIX_AGENT.md` Step 4 for the authoritative structure.

### Excluded test directories

Tests under `suite/e2e/tests/trading-live/` are excluded from analysis — omitted entirely, not placed in `skipped`.

---

## Cross-run state — known-failures ledger

Runs share memory through a single `ledger.json` in S3
(`s3://dev.suite.sldev.cz/coverage/e2e/fix-agent/ledger.json`), recording only _negative knowledge_
about recurring root causes. A root cause that stops failing drops out of the nightly results and
its entry is pruned — **a passing test is the only signal of resolution**; merged/closed PR state is
never read.

**Flow**

- `analyze` downloads the ledger and appends a compact view to the prompt. While routing clusters
  (Step 7), the agent matches each against the ledger by judgment — a match is routed to `skipped`
  reusing the entry's `reason`; only a genuinely new failure becomes a fix task.
- `update-ledger` (a dedicated job after `fix`) rebuilds the ledger from the run's outcomes via
  `ledger.ts` `buildLedger()`: one entry per root cause in this run's report, entries no longer
  failing simply absent. The result is uploaded to S3.

**Entry reasons** — the `SkipReason` enum is the `reason` on both report `skipped` entries and ledger entries:

| `reason`         | Meaning                                             |
| ---------------- | --------------------------------------------------- |
| `PRODUCT_BUG`    | Needs a product-logic change — agent can't resolve  |
| `INFRASTRUCTURE` | CI/environment issue — agent can't resolve          |
| `FIX_FAILED`     | Agent tried and couldn't fix it — don't re-attempt  |
| `FIX_DELIVERED`  | PR pushed, now in devs' hands — no further tracking |

A ledger match is never re-attempted. A `not_duplicated` result records nothing (failure not
reproduced — flaky or resolved). `buildLedger()` is pure and deterministic; matching is the agent's
judgment at Step 7, not a computed key (the same spec can fail for different reasons across runs).
