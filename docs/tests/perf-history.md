# Performance history

A performance report tells you what one run measured; it cannot tell you whether that is worse than
last week. The history lives as plain objects in the S3 bucket CI already writes to — **no server,
no database, nothing to operate** — and it is shared by every surface we measure: the web and
desktop e2e runs and the mobile Detox runs.

## Layout

```
s3://dev.suite.sldev.cz/e2e/perf/v1/
├── runs/<surface>/<branch>/<sha>/<run>-<attempt>/shard-<n>/<artifact>.json
├── index/<surface>/<branch>/index.ndjson        ← one line per measurement per run
├── index/<surface>/pr/<number>/<run>-<attempt>-<shard>.ndjson
└── baseline/<surface>/<branch>/latest.json      ← what later runs compare against
```

`<surface>` is `web`, `desktop`, `android` or `ios`. It sits high in the key so retention can differ
per surface, and so a merged view is a concatenation of index files.

Every object is world-readable over `https://dev.suite.sldev.cz/<key>`, so **reading the history
needs no credentials** — fetch the index, and download an artifact only when you want the detail
behind a point. Writing uses the `gh_actions_trezor_suite_dev_deploy` role CI already assumes.

## What is shared and what is not

Unified is the envelope: identity, index row, key scheme, baseline document and upload bundle, all
in `@trezor/perf-e2e`. Surface-specific is the artifact, stored as produced and labelled with a
`kind`, because a Lighthouse report and a Detox report are not the same document and flattening them
would throw away what makes each one worth opening.

| `blob.kind`          | Written by                      | Opened with                                               |
| -------------------- | ------------------------------- | --------------------------------------------------------- |
| `browser-report`     | web & desktop e2e               | the numbers in the row; the document holds the comparison |
| `native-report`      | Android/iOS Detox               | same                                                      |
| `lhr`, `flow-result` | Lighthouse runs (not yet wired) | Lighthouse's own `generateReport(lhr, 'html')`, offline   |

Metric keys are namespaced by the instrument, never the surface: `browser:` for our in-page
instrumentation (which also runs inside Electron), `rn:` for the React Native numbers, `lh:` for
Lighthouse audits. Nothing can accidentally compare a mobile time-to-interactive with a web total
blocking time, while one trend query and one delta implementation serve all of them.

## How a run publishes

Shards never write to the store. Each one leaves an artifact — `perf-history-<target>-<group>` for
the browser surfaces, `android-perf-report-<shard>` for mobile — and a single `Publish performance
history` job per workflow downloads them, maps them through the adapter for that surface and uploads
the bundle.

Three properties keep this correct without a database:

- **One writer per run**, so no two shards touch an object. Branch runs, which append to one rolling
  index, are additionally serialized by the job's concurrency group.
- **A re-run replaces its own lines.** Index lines are keyed by surface, run, attempt, shard and
  measurement, so re-running corrects a point instead of doubling it.
- **Artifacts upload before the lines that reference them**, in two passes, so a reader never meets
  an index line pointing at an object that is not there yet.

Publishing never gates a run: a missing artifact, an unset environment, an unknown platform or an
unreachable index all end in a printed status and exit 0.

## Reading it back

A page is served from the store itself, so it needs nothing installed and no credentials:

**<https://dev.suite.sldev.cz/e2e/perf/v1/dashboard/index.html>** — pick a surface, a branch and a
metric; each scenario gets its own trend and links through to the artifact behind its latest point.
It reads the same rolling index described above, with relative URLs, and is redeployed whenever a
run publishes. A branch with no run yet simply reports that its index does not exist.

For anything else, the rows are plain text:

```sh
curl -s https://dev.suite.sldev.cz/e2e/perf/v1/index/web/develop/index.ndjson | tail -20
```

Each line carries the identity, the sample count, the metric map and the key of its artifact:

```jsonc
{
    "ts": "…",
    "surface": "web",
    "branch": "develop",
    "sha": "…",
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

## Baselines

Only a run on the base branch seals `baseline/<surface>/<branch>/latest.json`
(`PERF_SEAL_BASELINE`), which `mergeStoredBaseline` lets win over the numbers committed in a
`budgets.ts`. Until the first baseline is sealed, `fetchBaselineDocument` reports `absent` and the
committed values stand — as they do whenever the object cannot be read.

## Where things live

| Path                                                     | What                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/perf-e2e/src/store.ts`                         | key scheme, index rows, baseline document, upload bundle — pure |
| `packages/perf-e2e/src/storeReader.ts`                   | reading the history back, credential-free, never throwing       |
| `packages/perf-e2e/src/publishRuns.ts`                   | the publish half every surface shares                           |
| `packages/perf-e2e/src/browserHistory.ts`                | the web/desktop history document and its mapping                |
| `suite/e2e/performance/publishPerformance.ts`            | the web/desktop adapter                                         |
| `suite-native/app/e2e/performance/publishPerformance.ts` | the mobile adapter                                              |
