# bot fixer

# Autonomous Nightly Test Fix Agent — Design Summary

---

## Goal

A fully automated system that runs after nightly tests, analyzes failures, implements fixes, and iterates until tests pass. Delivers a PR with fixed tests and full audit trail for anything it couldn't fix.

---

## Overall Architecture

```
Analysis Agent
  → report.json + report.md
  → gh workflow run fix-tests.yml

GitHub Actions: fix-tests.yml
  matrix: one job per fix task (parallel)
    each job: Fix Agent loop → writes fix-result.json + pr-description.md → push branch + gh pr create
  final job: Slack notification (reads GHA job outputs, no filesystem access needed)

GHA: .github/workflows/test-suite-nightly-fix-agent.yml
Source: packages/e2e-utils/src/fixBot
```

The GitHub Actions workflow IS the orchestrator. No separate orchestration program needed.

### Fix Agent Output Contract

After completing its work, the fix agent writes two files to the **worktree root** (never committed):

- **`fix-result.json`** — machine-readable result for the caller:
    ```json
    {
        "taskId": "fix-001",
        "result": "pass | partial | fail | not_duplicated",
        "iterations": 2,
        "passed": ["web/T3W1/suite/e2e/tests/wallet/send.ts"],
        "failed": [],
        "prTitle": "Nightly fix 26-05-19 - send-button locator"
    }
    ```
- **`pr-description.md`** — ready-to-post PR body, passed directly to `gh pr create --body-file`

These files are **not committed** — the caller (fix.sh locally, matrix job in GHA) reads them from the filesystem immediately after the agent exits, on the same machine. No artifact upload or cross-job file transfer needed.

Each matrix job is fully self-contained: run agent → read files → push branch → create PR. The final job only aggregates GHA job outputs for the Slack summary; it never touches the worktree.

## Phase 1: Analysis Agent

---

Extends the existing `AGENT.md`. The existing Steps 1–6 stay as-is. The clustering behavior already emerges naturally from the current agent — confirmed working.

**New addition:** after the diagnosis, a clustering pass where the agent groups failures by shared root cause into **fix tasks**.

**New output:** `report.json` alongside the existing `report.md`.

### Fix Scope Classification

| Value         | Meaning                                                     | Automatable       |
| ------------- | ----------------------------------------------------------- | ----------------- |
| `TEST_CODE`   | Only test files need to change                              | ✅                |
| `LOCATOR_ADD` | Add/modify `data-testid` in product component + update test | ✅                |
| `PRODUCT_BUG` | Actual product logic needs fixing                           | ❌ human required |
| `INFRA`       | CI/environment issue                                        | ❌ human required |

The only allowed product change is adding or modifying `data-testid` attributes. No product logic changes.

### Confidence → Iteration Budget

| Confidence              | Max iterations    |
| ----------------------- | ----------------- |
| `HIGH`                  | 3                 |
| `MEDIUM`                | 2                 |
| `LOW`                   | 1                 |
| `PRODUCT_BUG` / `INFRA` | 0 — not attempted |

`{
  "runDate": "2026-04-23",
  "webRunId": "...",
  "desktopRunId": "...",
  "fixTasks": [
    {
      "id": "fix-001",
      "branch": "fix/nightly-2026-04-23-send-button-locator",
      "rootCause": "send-button data-testid renamed in SendForm component",
      "fixScope": "LOCATOR_ADD",
      "confidence": "HIGH",
      "fixDescription": "Add data-testid='send-button' to submit button in SendForm.tsx, update page object",
      "diagnosis": "<MD prose for the tests in this fix task — error messages, stack traces, visual evidence, root cause reasoning>",
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
      "reason": "PRODUCT_BUG — requires human review",
      "affectedTests": ["suite/e2e/tests/firmware/update.ts"]
    }
  ]
}`

`validations` covers **every** affected platform/group/spec combination — no deduplication. The `diagnosis` field contains the relevant MD prose written by the analysis agent at clustering time, so each fix agent receives exactly the context it needs without touching other fix tasks.

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
Fix agent reads trace from disk when it needs visual context
Loop:
  modify code
  rebuild electorn app if needed
  run validations
  read new trace if needed
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

| Result         | Action                                           |
| -------------- | ------------------------------------------------ |
| All pass       | Push branch, create PR ✅                        |
| Some pass      | Push branch, create PR ⚠️                        |
| Zero pass      | Written summary in job log — no branch pushed ❌ |
| Not duplicated | Written summary in job log — no branch pushed 🔵 |

### Git strategy

- One branch and worktree per fix task, name prepared by the analysis agent and included in `report.json` as `branch`: `fix/nightly-YYYY-MM-DD-<root-cause-slug>`
- PRs are created only when ≥1 validation passes
- PR is assigned to the **QA and Test Automation** GitHub project (org project #78)

### PR description

The fix agent writes a per-task `pr-description.md` covering: root cause, fix applied, a validation status table (✅/❌ per platform/group/spec), the commit log, and any prompt gaps encountered. See `FIX_AGENT.md` Step 4 for the authoritative structure.

### Excluded test directories

Tests under `suite/e2e/tests/trading-live/` are excluded from analysis — omitted entirely, not placed in `skipped`.

---

## Known Problems

### No cross-run state: redundant re-processing of known failures

Each run of the system is fully stateless. There is no memory of what previous runs analyzed, attempted, or produced. This causes a class of problems when the same root causes recur across consecutive nightly runs.

**Concrete scenario:**

On Day 1, four root causes fail: A, B, C, D.

- A is diagnosed as unfixable (`PRODUCT_BUG` or `INFRA`) and placed in `skipped`.
- B, C, D are fixable. The fix agent succeeds on C and D, fails on B.
- D's PR is merged immediately. C's PR remains open pending further review.
- B produced no PR — the fix attempt exhausted its iteration budget without passing.

On Day 2, the nightly run produces failures for A, B, C, and a new root cause E.

- **A** is re-analyzed from scratch — traces fetched, code read, the same unfixable conclusion reached. All of that work was already done the day before.
- **B** is re-analyzed from scratch and a new fix task is generated. The fixer starts over with no knowledge of what was attempted the previous day.
- **C** already has an open PR. The system generates a new fix task for it anyway, and the fixer creates a competing branch targeting the same failing tests.
- **E** is genuinely new and needs to be processed. ✅

The result: tokens and CI time are spent re-diagnosing A, B, and C; a competing PR is created for C; and the system provides no signal distinguishing chronic failures from new ones.

**What the system does not currently track between runs:**

- Which root causes were already diagnosed as unfixable
- Which root causes have an open fix PR
- Which root causes were attempted but produced no PR (fix agent failed)
- How many times a given root cause has been attempted without success

### Failed fix attempts leave no readable audit trail

When the fix agent exhausts its iteration budget without passing a single validation, no branch is pushed and no PR is created. The only record of what was attempted lives in the raw GHA job log, which is verbose, ephemeral, and not structured for human reading.
