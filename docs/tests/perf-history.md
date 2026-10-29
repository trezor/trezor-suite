# Performance history

A performance report tells you what one run measured; it cannot tell you whether that is worse than
last week. The history lives as plain objects in the S3 bucket CI already writes to — **no server,
no database, nothing to operate** — and it is shared by every platform we measure: the web and
desktop e2e runs and the mobile Detox runs.

## Layout

```
s3://dev.suite.sldev.cz/e2e/perf/v1/
├── runs/<platform>/<branch>/<commit-id>/<run>-<attempt>/shard-<n>/<artifact>.json
├── index/<platform>/<branch>/index.ndjson        ← one line per measurement per run
├── index/<platform>/pr/<number>/<run>-<attempt>-<shard>.ndjson
└── baseline/<platform>/<branch>/latest.json      ← what later runs compare against
```

`<platform>` is `web`, `desktop`, `android` or `ios`. It sits high in the key so retention can differ
per platform, and so a merged view is a concatenation of index files.

Every object is world-readable over `https://dev.suite.sldev.cz/e2e/perf/v1/<key>`, so **reading the history
needs no credentials** — fetch the index, and download an artifact only when you want the detail
behind a point. Writing uses the `gh_actions_trezor_suite_dev_deploy` role CI already assumes.

## What is shared and what is not

Unified is the envelope: identity, index row, key scheme, baseline document and upload bundle, all
in `@trezor/perf-e2e`. Platform-specific is the artifact, stored as produced and labelled with a
`kind`, because a Lighthouse report and a Detox report are not the same document and flattening them
would throw away what makes each one worth opening.

| `blob.kind`          | Written by        | Opened with                                               |
| -------------------- | ----------------- | --------------------------------------------------------- |
| `browser-report`     | web & desktop e2e | the numbers in the row; the document holds the comparison |
| `native-report`      | Android/iOS Detox | same                                                      |
| `lhr`, `flow-result` | Lighthouse runs   | Lighthouse's own `generateReport(lhr, 'html')`, offline   |

Metric keys are namespaced by the instrument, never the platform: `browser:` for our in-page
instrumentation (which also runs inside Electron), `rn:` for the React Native numbers, `lh:` for
Lighthouse audits. Nothing can accidentally compare a mobile time-to-interactive with a web total
blocking time, while one trend query and one delta implementation serve all of them.

## How a run publishes

Shards never write to the store. Each one leaves an artifact — `perf-history-<target>-<group>` for
the browser platforms, `android-perf-report-<shard>` for mobile — and a single `Publish performance
history` job per workflow downloads them, maps them through the adapter for that platform and uploads
the bundle.

Three properties keep this correct without a database:

- **One writer per run**, so no two shards touch an object. Branch runs, which append to one rolling
  index, are additionally serialized by the job's concurrency group.
- **A re-run replaces its own lines.** Index lines are keyed by platform, run, attempt, shard and
  measurement, so re-running corrects a point instead of doubling it.
- **Artifacts upload before the lines that reference them**, in two passes, so a reader never meets
  an index line pointing at an object that is not there yet.

Publishing never gates a run: a missing artifact, an unset environment or an unknown platform all
end in a printed status and exit 0. An index that cannot be read back is left as it is, with a
warning on the job, rather than rewritten with only this run's lines.

## Reading it back

The rows are plain text:

```sh
curl -s https://dev.suite.sldev.cz/e2e/perf/v1/index/web/develop/index.ndjson | tail -20
```

Each line carries the identity, the sample count, the metric map and the key of its artifact:

```jsonc
{
    "ts": "…",
    "platform": "web",
    "branch": "develop",
    "commitId": "…",
    "run": "…",
    "shard": "3",
    "scenario": "wallet-discovery",
    "variant": "T3W1",
    "samples": 3,
    "metrics": { "browser:totalBlockingTimeMs": 611, "browser:longTaskCount": 22 },
    "blob": { "kind": "browser-report", "key": "runs/web/develop/…/shard-3/history.json" },
}
```

Fetch `runs/…` under the same prefix for the document behind a point.

## Lighthouse

Lighthouse records a timespan around each `@perf` measurement and the run stores the flow result —
one audited step per timespan — as an artifact of kind `flow-result`. Fetch one and render it, with
nothing installed but Lighthouse itself:

```sh
curl -sO https://dev.suite.sldev.cz/e2e/perf/v1/runs/web/develop/<commit-id>/<run>-1/shard-web-3/flow-<test>-T3W1-0.json
node -e "import('lighthouse').then(({generateReport})=>require('fs').writeFileSync('report.html',generateReport(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')),'html')))" flow-*.json
```

Its numbers also travel in the index row that points at it, under `lh:` keys. Those are namespaced
apart from `browser:` on purpose: Lighthouse and our in-page instrumentation measure overlapping
things by different means and disagree, so a report must never present them as one metric.

**What is stripped before storing**, and why — the audits themselves stay, so the rendered report
still lists them:

| removed                                     | why                                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `lhr.fullPageScreenshot`                    | top-level in Lighthouse 13, not an audit; the biggest payload, and the only part that can show a wallet screen |
| `final-screenshot`, `screenshot-thumbnails` | base64 images and the filmstrip                                                                                |
| `user-timings` details                      | unbounded — a profiling build emits tens of thousands of entries, most of the document                         |

**Only the desktop nightly profiles.** `template-suite-run-e2e.yml` takes a `lighthouse` input, off
by default, so pull request and release runs stay untraced and their over-limit alarm keeps working.
The web nightly does not profile: its build is coverage-instrumented, and Lighthouse would measure
the instrumentation. Only the tests that call `perf.measure` open a timespan, and a run that cannot
attach to the app's debugging endpoint warns and records nothing — Lighthouse never fails a test.
Locally, set `LIGHTHOUSE=1` (or `yarn test:e2e:web:lighthouse`).

Tracing costs the app time, so a profiled measurement's own `browser:` numbers sit above what the
same commit costs untraced. Three things follow, decided per measurement rather than per run, because
a test that could not attach was not traced:

- the index row carries `profiled: true`, so a trend can keep traced and untraced points apart and
  a step between them reads as the tracer rather than as a regression;
- the report marks the measurement `(profiled)` in the console and the pull request comment, and its
  over-limit annotation is a `::notice` rather than a red `::error`;
- no budgets paste entry and no suggested limit come from a profiled measurement. Writing a traced
  number into `budgets.ts` would raise the limit by the overhead and leave every later untraced run
  comfortably under it.

The desktop baseline the nightly seals therefore holds traced `browser:` numbers for the profiled
scenarios, while a pull request measures them untraced; compare such points through the index rows'
`profiled` flag, not against the sealed baseline. `budgets.ts` was recorded without a tracer;
refresh it from an unprofiled run.

The browser history document and its mapping live in `packages/perf-e2e/src/browserHistory.ts`, the
flow-result stripping in `lighthouseFlow.ts`, and the web/desktop adapter in
`suite/e2e/performance/publishPerformance.ts`.

## Baselines

Only a run on `develop` seals `baseline/<platform>/<branch>/latest.json`
(`PERF_SEAL_BASELINE`), which `mergeStoredBaseline` lets win over the numbers committed in a
`budgets.ts`. Until the first baseline is sealed, `fetchBaselineDocument` reports `absent` and the
committed values stand — as they do whenever the object cannot be read.

## Where things live

| Path                                   | What                                                            |
| -------------------------------------- | --------------------------------------------------------------- |
| `packages/perf-e2e/src/store.ts`       | key scheme, index rows, baseline document, upload bundle — pure |
| `packages/perf-e2e/src/storeReader.ts` | reading the history back, credential-free, never throwing       |
| `packages/perf-e2e/src/publishRuns.ts` | the publish half every platform shares                          |
