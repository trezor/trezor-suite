# Reporter Watchdog

The GitHub reporter (this package's `githubReporter`, consumed as a Playwright reporter by web/desktop and
as a Jest reporter by suite-native) populates the "Trezor Suite release testing" GitHub Project board once a
month during release testing. Because it only runs monthly, unrelated changes to the test framework or CI
workflows silently break it, and the breakage is discovered mid-release (e.g. the June 2026 native release
run failed on a ts-node/ESM incompatibility introduced a month earlier).

The watchdog dry-runs the **real reporter chain** — same workflows, same build + docker, same reporter
injection — against a dedicated sandbox project (`Trezor Suite reporter healthcheck`), so breakage is
caught within ~24h and on PRs that touch the fragile surface.

## Modes

|                | Real (monthly)                                                                                                           | Watchdog                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry          | `workflow_dispatch` on `test-suite-release-e2e-report-orchestration.yml` and `test-suite-native-e2e-manual-reporter.yml` | `schedule` / `pull_request` (paths) / `workflow_dispatch` on `test-suite-reporter-watchdog.yml`                                             |
| GitHub Project | Trezor Suite release testing                                                                                             | Trezor Suite reporter healthcheck                                                                                                           |
| Test selection | full suites                                                                                                              | 2 automated + 3 manual synthetics (`suite/e2e/reporter-watchdog/`) + 2 native manual synthetics (`suite-native/app/e2e/reporter-watchdog/`) |
| Verdict        | n/a                                                                                                                      | `verify` job reads the sandbox back                                                                                                         |

The real workflows contain no watchdog code — a monthly dispatch structurally cannot fall into sandbox mode.
The only mode switch is the `reporterWatchdog` flag threaded through the callers into `REPORTER_WATCHDOG`,
which flips the project name in `gitHubProject.ts`, the Playwright manual config's `testDir`, and the native
Jest reporter config's `testMatch`.

## Call graph (watchdog run)

```
test-suite-reporter-watchdog.yml
  ├─ wipe-sandbox                     delete all sandbox items (clean slate)
  ├─ call-test-suite-manual-release   → github:report:manual, testFilter=reporter-watchdog.manual.spec.ts
  │                                     3 describe.skip synthetics → issued as Todo with full field spread
  ├─ call-test-suite-web-desktop-e2e-release   (1 desktop + 1 web template job via resolve-matrix)
  │                                     → playwright-reporter-watchdog.config.ts
  │                                     "automated pass" → AutoPass → no issue
  │                                     "automated fail" → genuine failure → Auto FAIL issue (+ retries exercise updateIssue)
  ├─ call-test-suite-native-manual-release   → native github:report:manual (Jest)
  │                                     2 describe.skip synthetics → issued as Todo with full field spread
  └─ verify                           read sandbox: FAIL issue present, PASS absent, manual issues (web + native)
                                      + fields present, Release Build populated; exit code = health verdict
```

## Why the synthetic tests look the way they do

- The automated specs use bare `@playwright/test` (no fixtures) → no trezor-user-env, no app, instant.
- They are tagged only `@reporterWatchdog`, which no real Playwright project selects (every real project
  greps for a device model, `@noDevice`, or `@group=manual`), so they can never red normal runs.
- The failing test must fail **genuinely**: `test.fail()` marks the outcome expected → classified AutoPass →
  the reporter skips issue creation. Its failure is neutralized by a watchdog-gated `continue-on-error`
  in `template-suite-run-e2e.yml`; the `verify` job is the sole gate.
- The manual specs are `describe.skip` with empty bodies → reported as Todo without launching anything.
- The native specs are Jest, not Playwright: `describe.skip` + `wrappedIt` metadata, selected by a
  `REPORTER_WATCHDOG`-gated `testMatch` in `jest.config.reporter.js`. Their `/manual/` path segment is what
  classifies them as manual (Jest has no tags; `isManual` is path-based). All are skipped → Jest exits 0 →
  the native job needs no `continue-on-error`.

## Bootstrap & rollout

- One-time (already done): create the sandbox project with
  `REPORTER_WATCHDOG=true yarn workspace @trezor/e2e-utils github:create:project`.
- Local runs of `reporter-watchdog:wipe` / `reporter-watchdog:verify` need a project-scoped `GITHUB_TOKEN`
  in `packages/e2e-utils/.env`; a local native reporter run reads it from `suite-native/app/e2e/.env`.
  On CI the trezor-bot app token is used.
- The nightly cron (22:00 UTC Sun–Thu, offset from the 00:00 nightly whose instrumented web build shares the S3 path)
  and the Actions-UI dispatch button activate once the workflow lands on develop; the introducing PR
  self-tests via the `pull_request` paths filter.

## Known caveats

- **The `verify` job conclusion is the only red signal** — the Playwright template jobs are green by design.
- The web and desktop runs both report the failing synthetic; near-simultaneous first failures can race
  `createIssue` and leave a duplicate sandbox item. Harmless (verify matches by title) and wiped next run.
- Watchdog runs record to a dedicated Currents project (`iBEsWE`, resolved in the release caller's
  `resolve-matrix` job), so the nightly synthetic failure never pollutes the release dashboards.
  The manual paths (web and native) never talk to Currents.
- A native spec that fails to load produces no reporter output at all (the Jest reporter prints per-test
  results only, and suite-level errors have none) — the watchdog catches this only indirectly, via missing
  sandbox items → red verify.
