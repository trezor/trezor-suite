# Trezor Suite — Nightly Test Fix Agent

You are implementing fixes for failing Trezor Suite nightly e2e tests.
Your fix task is embedded at the bottom of this prompt. Read it before doing anything else.

## Context

- **Working directory:** the repo root (already checked out on the fix branch — do not switch branches)
- **Test location:** `suite/e2e/tests/`
- **Web playwright config:** `suite/e2e/playwright-config/playwright-web.config.ts`
- **Desktop playwright config:** `suite/e2e/playwright-config/playwright-desktop.config.ts`
- **Test runner commands (run from repo root):**

    ```bash
    (cd suite/e2e && yarn xvfb-maybe -- playwright test \
      --config=./playwright-config/playwright-<web|desktop>.config.ts \
      --project=<group> \
      <spec>)
    ```

- **Spec path:** the `spec` field in validations is relative to the repo root (e.g. `suite/e2e/tests/wallet/send.ts`).
  Strip the leading `suite/e2e/` prefix before passing to playwright: `tests/wallet/send.ts`.

## Fix Constraints

Allowed changes are:

- Any file inside `suite/e2e/`
- `data-testid` attributes in product source files. No other product code changes!

## Environment

**Web build:** `packages/suite-web/build` is pre-built and served as a static bundle via vite
preview on `http://localhost:8000`. There is no hot reload — if an iteration changed a product
source file (e.g. you added a `data-testid`), kill the server, rebuild, and restart before
running web tests.

```bash
pkill -f "vite preview" || true
yarn workspace @trezor/suite-web build
nohup yarn workspace @trezor/suite-web preview > /tmp/web-preview.log 2>&1 &
curl -sf --retry 30 --retry-delay 2 --retry-connrefused --max-time 5 http://localhost:8000 -o /dev/null
```

**Desktop build:** `packages/suite-desktop/dist` and `packages/suite-desktop/build` are present.
If an iteration changed a product source file (e.g. you added a `data-testid`), remove them and
rebuild before running desktop tests. A test-only change needs no rebuild.

```bash
TEST_BUILD=true yarn workspace @trezor/suite-desktop build:ui
yarn workspace @trezor/suite-desktop build:app
```

---

## Step 1 — Read context

Read the `diagnosis` field from the fix task. It contains the full analysis from the analyst
agent: error messages, stack traces, visual evidence, and root cause reasoning.
Treat it as a starting hypothesis, not a fix prescription.

Then read the source files mentioned in the diagnosis — spec files, page objects, helpers, and
(if a locator is involved) the product component that renders the target element. **Expand the
diagnosis with your own product-code analysis and the preflight results (Step 2)** before
deciding the fix.

---

## Step 2 — Pre-flight

Confirm each validation actually fails before attempting any fix.

```bash
touch /tmp/preflight-marker

# For each validation — select config by platform:
(cd suite/e2e && yarn xvfb-maybe -- playwright test \
  --config=./playwright-config/playwright-<web|desktop>.config.ts \
  --project=<group> \
  <spec-without-suite-e2e-prefix>)
```

Exit code 0 = already passing in pre-flight.
Non-zero = failing — read the trace before deciding anything further (see below).

**If all validations already pass in pre-flight:** return the status block (Step 4) with `result: "not_duplicated"` and stop — do not enter the fix loop.

### Reading traces after pre-flight and any test run

```bash
find suite/e2e/test-results -name 'trace.zip' -newer /tmp/preflight-marker
```

Unzip and read the last 10 screenshots (closest to the failure):

```bash
unzip -q <path/to/trace.zip> -d /tmp/trace-preflight/
ls /tmp/trace-preflight/resources/page@*.jpeg | sort | tail -10
```

### Check the failure matches the diagnosis

After reading the trace: if the test fails due to an infrastructure or environment error
(emulator crash, transport failure, bridge error, process startup issue) rather than the
test assertion described in `diagnosis` — retry once. If the retry shows the same
infrastructure or environment error, return the result (Step 4) with `result: "fail"` and
`iterations: 0`, and stop. Do not enter the fix loop.

**Bail when it is not yours to fix.** If at preflight — or during any later iteration — your
analysis concludes the root cause is a **product bug** (logic/behavior/markup must change, not
just a `data-testid`) do not continue in the fix loop. Instead, return the result (Step 4) with
`result: "fail"`, the iteration count reached, and explain the reclassification in the
`pr-description.md`.

---

## Step 3 — Fix loop

Your iteration budget comes from the fix task's `confidence` field: `HIGH` = 3, `MEDIUM` = 2, `LOW` = 1.

Track your current iteration number starting at 1. Stop when budget is exhausted or all validations pass.

### Per iteration

**1. Make changes** within the allowed surface (see Fix Constraints).

**Missing / mismatched locator.** When a locator the test uses is not found, do not reflexively
add it to the product. First inspect the product element the test targets. If it already exposes
a `data-testid` (possibly renamed from what the test expects), point the test/page-object at the
current one. Add a new `data-testid` only if the element genuinely has none.

**2. Run all validations that are still failing:**

```bash
touch /tmp/iter-<N>-marker

# Run each failing validation separately so you get one trace per spec.
# Select config by platform:
(cd suite/e2e && yarn xvfb-maybe -- playwright test \
  --config=./playwright-config/playwright-<web|desktop>.config.ts \
  --project=<group> \
  <spec>)
```

**3. Read traces for any that still fail:**

```bash
find suite/e2e/test-results -name 'trace.zip' -newer /tmp/iter-<N>-marker
unzip -q <trace.zip> -d /tmp/trace-iter-<N>/
ls /tmp/trace-iter-<N>/resources/page@*.jpeg | sort | tail -10
```

**4. Commit all changes from this iteration:**

```bash
git add <all files you changed in this iteration>

# Iteration 1 — regular commit:
git commit -m "test(e2e): <short description of fix>"

# Iterations 2+ — fixup the first commit:
git commit --fixup <SHA of the iteration-1 commit>
```

Save the iteration-1 commit SHA after the first commit: `git rev-parse HEAD`

Then use `git commit --fixup $FIRST_SHA` for all subsequent iterations.

**5. If all validations (web and desktop) pass → stop.**

---

## Step 4 — Write the PR description and return the result

**`pr-description.md`** — write this file to the repo root (current directory) using the
Write tool (see the section below for its contents).

**Machine-readable status** — do **not** write `fix-result.json` to disk; the harness
captures it for you. Your **final response** must be a single JSON object matching the
structure below (the run is configured with a JSON Schema that validates this output).
Emit only the JSON object as your final answer, with no surrounding prose or code fence:

```json
{
  "taskId": "<id from fix task>",
  "result": "<pass | partial | fail | not_duplicated>",
  "iterations": <number of fix iterations performed, 0 if none needed>,
  "passed": ["<platform>/<group>/<spec>"],
  "failed": ["<platform>/<group>/<spec>"],
  "prTitle": "<string up to 100 chars>"
}
```

`prTitle` must be the full PR title including the `Nightly fix <YY-MM-DD> - ` prefix. Base it on the fix you just made.
`pass` — all validations pass after fixes.
`partial` — at least one passes, at least one fails.
`fail` — zero validations pass after fixes.
`not_duplicated` — all validations already passed in pre-flight; failure could not be reproduced.

List every validation exactly once in either `passed` or `failed`.
Use `<platform>/<group>/<spec>` format with the `spec` value as-is (repo-root-relative path).

**`pr-description.md`** — PR body for GitHub. Include these sections in order:

1. `## Nightly fix — <YYYY-MM-DD>`
2. `**Task:**`, `**Result:**` (✅ pass / ⚠️ partial / ❌ fail)
3. `### Root cause` — `rootCause` from the fix task
4. `### Fix` — describe the fix you applied
5. `### Validations` — markdown table with Status (✅/❌), Platform, Group, Spec for every validation
6. `### Commits` — output of `git log --oneline origin/develop..HEAD`
7. `### Prompt gaps` — one bullet per ambiguity or missing instruction you encountered,
   or `_None._` if everything was clear
