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
```

The GitHub Actions workflow IS the orchestrator. No separate orchestration program needed.

### Fix Agent Output Contract

After completing its work, the fix agent writes two files to the **worktree root** (never committed):

- **`fix-result.json`** — machine-readable result for the caller:
    ```json
    {
        "task_id": "fix-001",
        "result": "pass | partial | fail",
        "iterations": 2,
        "passed": ["web/T3W1/suite/e2e/tests/wallet/send.ts"],
        "failed": []
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
| `LOCATOR_ADD` | Add/modify `data-testid` in product component + update test | ✅                |
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
  "run_date": "2026-04-23",
  "web_run_id": "...",
  "desktop_run_id": "...",
  "fix_tasks": [
    {
      "id": "fix-001",
      "branch": "fix/nightly-2026-04-23-send-button-locator",
      "root_cause": "send-button data-testid renamed in SendForm component",
      "fix_scope": "LOCATOR_ADD",
      "confidence": "HIGH",
      "fix_description": "Add data-testid='send-button' to submit button in SendForm.tsx, update page object",
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
      "root_cause": "...",
      "reason": "PRODUCT_BUG — requires human review",
      "affected_tests": ["suite/e2e/tests/firmware/update.ts"]
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
Setup environment (dev server / build electron app / emulator)
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

- May only change test files and `data-testid` attributes in product components
- Must run ALL validations listed in the fix task
- A fix task is "done" when every validation passes or the iteration budget is exhausted

---

## Commit and PR Logic

### Per iteration

Every iteration commits locally. First iteration is a regular commit, subsequent ones are `--fixup`.

- First commit: generic message, e.g. `test(e2e): fix send-button locator`
- Subsequent iterations: `git commit --fixup HEAD` (no custom message, auto-generated)

| Result    | Action                                           |
| --------- | ------------------------------------------------ |
| All pass  | Push branch, create PR ✅                        |
| Some pass | Push branch, create PR ⚠️                        |
| Zero pass | Written summary in job log — no branch pushed ❌ |

### Git strategy

- One branch per fix task, name prepared by the analysis agent and included in `report.json` as `branch`: `fix/nightly-YYYY-MM-DD-<root-cause-slug>`
- PRs are created only when ≥1 validation passes

### PR description structure

## Nightly Fix — 2026-04-23

✅ Fixed (3 tasks — 8 tests)
⚠️ Partially fixed (1 task — 2/3 tests passing, see attempt log)
❌ Failed to fix (1 task — see attempt log)
🚫 Human required (2 tasks — PRODUCT_BUG, INFRA)
