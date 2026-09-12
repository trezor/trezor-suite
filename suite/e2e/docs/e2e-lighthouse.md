# Lighthouse in E2E tests

Records a [Lighthouse timespan](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md#timespan)
around interactions an E2E test already performs, and writes Lighthouse's own flow report — one
navigable step per timespan — next to the test's artifacts.

It answers _"what would Lighthouse say about the interactions we already measure ourselves?"_. It is
off by default, nothing it reports is gated, and no number it produces can fail a test.

## Running it

Lighthouse needs the app under test to expose a CDP endpoint, so it is enabled at launch time
through the `LIGHTHOUSE` env variable; the launch arguments follow from it automatically.

```bash
yarn workspace @trezor/suite-e2e test:e2e:web:lighthouse
```

```bash
yarn workspace @trezor/suite-e2e test:e2e:desktop:lighthouse
```

Both scripts are `LIGHTHOUSE=1 <the usual run> --grep @perf`, so any run can be profiled by setting
the variable and picking the tests yourself:

| Value               | What gets recorded                                                       |
| ------------------- | ------------------------------------------------------------------------ |
| unset               | Nothing. Tests run exactly as they do today.                             |
| `1` (alias `steps`) | One timespan per `perf.measure` block, i.e. per measured scenario.       |
| `test`              | One timespan around the whole test body, for tests that measure nothing. |

`LIGHTHOUSE=test` profiles _any_ test, including one that never takes the `perf` fixture — the price
is a single timespan covering setup, device work and teardown alike, which is a much blunter
instrument than the per-scenario steps.

On web, the app under test comes from `BASE_URL` as usual — `http://localhost:8000` locally,
`https://dev.suite.sldev.cz/suite-web/<branch>/web/` on CI — no extra setup for Lighthouse.

## What you get

In `test-results/<file>-<title>-<project>/`:

- **`lighthouse-flow-report.html`** — the flow report; open it in a browser. Also attached to the
  Playwright HTML report. A profiling run prints nothing of its own — the artifacts are the report.
- **`lighthouse-flow-result.json`** — the same data as JSON. Each `steps[].lhr` is a complete
  Lighthouse result, which is what the Lighthouse (LHCI) server ingests.
- **`lighthouse-flow-meta.json`** — which measurement the flow result is a sample of: device model,
  target (web/desktop), retry, test title. The LHR itself knows none of that.
- **`perf-report-<scenario>.json`** — the `perf.measure` in-page numbers (react commits, interaction
  duration, long tasks…) with the same meta, one file per measured scenario.

Timespan mode has no FCP and no LCP: those describe a page load, and a timespan deliberately does
not contain one. What it does have is the breakdown of the interaction — total blocking time,
main-thread work by category, script bootup.

## The per-PR performance report

On PRs, both e2e workflows run with `lighthouse: "true"`: every shard uploads the three JSON files
above as a `perf-results-*` artifact, and the `perf-report` job then computes per-scenario deltas against the
latest sealed `develop` baseline (produced by the nightly run) and overwrites the
**⚡ Performance report** section of the PR description. T3W1 is measured on both targets per PR;
T3T1 accrues samples nightly.

The report is informative only — nothing is gated, and it degrades instead of failing: no baseline
→ absolute values, server down or token missing → the section says so, focused run without `@perf`
specs → the previous section is left untouched (it names the SHA it measured). A metric is flagged
🔴/🟢 only when both a relative and an absolute floor trip, computed on medians.

The same script runs locally against artifacts already on disk:

```bash
yarn workspace @trezor/suite-e2e test:e2e:desktop:lighthouse
yarn workspace @trezor/suite-e2e perf:report
```

In a terminal that prints as an aligned block per measurement — the same shape as the end-of-run
budget report — with colour and `!!`/`++` marks on the flagged rows. Piped, redirected or in CI it
prints the markdown that goes into the PR instead, so `… perf:report > report.md` still gives you
something pasteable. `--format terminal|markdown` forces either. The `--out` file and the job step
summary are always markdown; only stdout follows the format.

Reading the baseline needs no credentials — the server's GETs are open. Environment, all optional
locally:

| Variable           | Meaning                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `LHCI_SERVER_URL`  | Lighthouse server base URL; without it the report has no baseline.  |
| `LHCI_BUILD_TOKEN` | Write token — only needed to upload (CI does, local runs need not). |
| `PERF_BRANCH`      | Branch label for uploads; defaults from git.                        |
| `PERF_HASH`        | Commit the samples describe; defaults from git.                     |
| `PERF_BASE_BRANCH` | Branch the baseline is read from (`develop`).                       |
| `PERF_RUN_URL`     | CI run link printed in the report.                                  |

History lives on the LHCI server (dashboard, per-URL trends, build compare view) — each measurement
is keyed by a synthetic URL `https://perf.suite.internal/<target>/<model>/<scenario>`. The server
itself is a small self-hosted stack; see `suite/lhci-server/README.md` for the runbook.

## How it works

Lighthouse drives a target through Puppeteer's CDPSession, using wildcard `'*'` protocol events,
`session.id()` and `sessionattached` — none of which Playwright's CDPSession exposes. So the app is
launched with `--remote-debugging-port` (see `buildArgs` in `support/electron.ts` for desktop and
`PlaywrightProjectBuilder` for web) and `puppeteer-core` attaches to the very target the test is
driving. Playwright keeps driving the interactions; Lighthouse only records.

The port is `9222 + TEST_PARALLEL_INDEX`, so parallel workers do not fight over one endpoint.

Lighthouse is told to measure the app as it is — no screen emulation, no user-agent rewrite, no
throttling. Its defaults would resize the window and slow the CPU down mid-test, which is enough to
break the test it is riding inside.

## Things to know before trusting a number

- **A `LIGHTHOUSE=1` run is not baseline material for `perf.measure`.** Lighthouse's tracing costs
  the app something, so the in-page numbers from such a run sit above a clean run's. The end-of-run
  report says so itself and withholds the `budgets.ts` paste block on such runs.
- **`performance/budgets.ts` keys carry no web/desktop dimension** and its numbers were recorded on
  desktop. A web run measures fine (instrumentation is installed on both targets), but do not
  record a web run's paste block over desktop-calibrated budgets.
- **A target has one tracing session.** Anything else that starts a CDP trace around the same
  interaction will fight the timespan for it.
- **Desktop reports are keyed by a `file://` URL**, because that is how the built app loads its
  renderer. Web runs report whatever `BASE_URL` the page was driven at — `http://localhost:8000/…`
  locally, the sldev URL on CI.
