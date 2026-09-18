import type { PerformanceScreen } from '@suite-native/performance-metrics';

import type {
    Baselines,
    PerformanceMetricKey,
    PerformanceReport,
    PerformanceReportMeta,
} from './types';

/**
 * Where a run's numbers go once the run is over, and under which key. There is no server: every
 * artifact is a plain object in the bucket CI already writes to, and the only reader that needs
 * credentials is CI itself — the objects are world-readable over https://dev.suite.sldev.cz/<key>.
 *
 * Two layers, deliberately:
 *   - `runs/` holds the whole report of one run, kept for drill-down and expired by a lifecycle rule;
 *   - `index/` holds one line per screen per run, ~200 B, kept forever — this is what trends read.
 *
 * Everything here is pure. The I/O (writing the bundle, handing it to `aws s3 cp`) lives in
 * `publishPerformance.ts`, so the key scheme and the row shape can be tested without a bucket.
 */

export const STORE_PREFIX = 'e2e/perf/native/v1';

/** The public origin the bucket is served on, for links printed next to the report. */
export const STORE_ORIGIN = 'https://dev.suite.sldev.cz';

/**
 * How many index lines one branch file keeps. At ~5 screens a run and a handful of runs a day this
 * is years of history, and it bounds the read-modify-write the develop writer performs.
 */
const INDEX_LINE_LIMIT = 20000;

export type PerfStoreContext = {
    /** Branch under test — `github.head_ref` on a PR, `github.ref_name` otherwise. */
    branch: string;
    sha: string;
    runId: string;
    runAttempt: string;
    /** Set on pull requests, which file their index lines per PR instead of per branch. */
    prNumber?: string;
    /** Link back to the workflow run that produced the numbers. */
    runUrl?: string;
};

export type ShardReport = {
    /** Matrix value of the shard that measured it, as the artifact carried it. */
    shard: string;
    report: PerformanceReport;
};

export type PerfIndexRow = {
    ts: string;
    branch: string;
    sha: string;
    run: string;
    attempt: string;
    shard: string;
    platform: PerformanceReportMeta['platform'];
    device: string;
    appVersion: string;
    screen: string;
    samples: number;
    metrics: Partial<Record<PerformanceMetricKey, number | null>>;
    /** Key of the full report this row was reduced from, for drill-down. */
    blob: string;
};

export type BaselineDocument = {
    updatedAt: string;
    branch: string;
    sha: string;
    run: string;
    runUrl?: string;
    /** The same shape as the committed `BASELINES`, so the two are interchangeable. */
    screens: Baselines;
};

export type UploadFile = {
    /** Path relative to the bundle root, which is also the key relative to `STORE_PREFIX`. */
    path: string;
    body: string;
};

/**
 * Branch names carry slashes and anything else git allows; keys stay flat, printable and stable.
 * Collisions are irrelevant here — the sha and run id below it keep every run distinct.
 */
export const slugifyRef = (ref: string): string =>
    ref
        .replace(/[^\w.\-/]+/g, '-')
        .replace(/\//g, '__')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'unknown';

export const runPrefix = ({ branch, sha, runId, runAttempt }: PerfStoreContext): string =>
    `runs/${slugifyRef(branch)}/${sha}/${runId}-${runAttempt}`;

/** The e2e job is sharded, so a run holds one report per shard and they must not overwrite. */
export const reportKey = (context: PerfStoreContext, shard: string): string =>
    `${runPrefix(context)}/shard-${shard}/report.json`;

/**
 * PR runs write their own immutable file per run: many PRs run at once and nothing may be shared,
 * or two runs would race. Branch runs (develop nightly) append to one rolling file instead, which
 * is safe because that job is serialized by its own concurrency group.
 */
export const indexKey = (context: PerfStoreContext): string =>
    context.prNumber
        ? `index/pr/${context.prNumber}/${context.runId}-${context.runAttempt}.ndjson`
        : `index/${slugifyRef(context.branch)}/index.ndjson`;

export const isRollingIndex = (context: PerfStoreContext): boolean => !context.prNumber;

export const baselineKey = (branch: string): string => `baseline/${slugifyRef(branch)}/latest.json`;

export const publicUrl = (key: string): string => `${STORE_ORIGIN}/${STORE_PREFIX}/${key}`;

const metricsOf = (screen: PerformanceReport['screens'][number]) =>
    Object.fromEntries(screen.metrics.map(metric => [metric.key, metric.current])) as Partial<
        Record<PerformanceMetricKey, number | null>
    >;

export const toIndexRows = (
    { shard, report }: ShardReport,
    context: PerfStoreContext,
): PerfIndexRow[] => {
    const blob = reportKey(context, shard);

    return report.screens.map(screen => ({
        ts: report.meta.generatedAt,
        branch: context.branch,
        sha: context.sha,
        run: context.runId,
        attempt: context.runAttempt,
        shard,
        platform: report.meta.platform,
        device: report.meta.device,
        appVersion: report.meta.appVersion,
        screen: screen.scenario,
        samples: screen.sampleCount,
        metrics: metricsOf(screen),
        blob,
    }));
};

export const renderNdjson = (rows: readonly PerfIndexRow[]): string =>
    rows.map(row => JSON.stringify(row)).join('\n') + (rows.length > 0 ? '\n' : '');

/** A line the file already holds that we cannot parse is dropped, never allowed to fail the run. */
export const parseNdjson = (text: string): PerfIndexRow[] =>
    text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .flatMap(line => {
            try {
                return [JSON.parse(line) as PerfIndexRow];
            } catch {
                return [];
            }
        });

const rowIdentity = (row: PerfIndexRow) => `${row.run}/${row.attempt}/${row.shard}/${row.screen}`;

/**
 * Re-running a workflow re-measures the same (run, attempt, shard, screen): the new numbers replace
 * the old line rather than adding a second one, so a re-run never doubles a point on the trend.
 */
export const appendIndexRows = (existing: string, rows: readonly PerfIndexRow[]): string => {
    const incoming = new Set(rows.map(rowIdentity));
    const kept = parseNdjson(existing).filter(row => !incoming.has(rowIdentity(row)));

    return renderNdjson([...kept, ...rows].slice(-INDEX_LINE_LIMIT));
};

/**
 * What later runs are compared against: every shard's screens in one document. A screen measured by
 * two shards keeps the last one written — they measure the same screen, not two different ones.
 */
export const toBaselineDocument = (
    reports: readonly ShardReport[],
    context: PerfStoreContext,
): BaselineDocument => ({
    updatedAt: reports[0]?.report.meta.generatedAt ?? new Date(0).toISOString(),
    branch: context.branch,
    sha: context.sha,
    run: context.runId,
    ...(context.runUrl ? { runUrl: context.runUrl } : {}),
    screens: Object.fromEntries(
        reports.flatMap(({ report }) =>
            report.screens.map(screen => [screen.scenario as PerformanceScreen, metricsOf(screen)]),
        ),
    ) as Baselines,
});

/**
 * Everything one run contributes, as files — every shard's report plus one index file. The caller
 * writes them under a bundle root and lets
 * `aws s3 cp --recursive` put the tree at `STORE_PREFIX` — so the layout on disk *is* the layout in
 * the bucket. One job publishes a whole run, so nothing here races with a sibling shard.
 */
export const buildUploadBundle = (
    reports: readonly ShardReport[],
    context: PerfStoreContext,
    options: { existingIndex?: string; sealBaseline?: boolean } = {},
): UploadFile[] => {
    const rows = reports.flatMap(shardReport => toIndexRows(shardReport, context));
    const files: UploadFile[] = [
        ...reports.map(({ shard, report }) => ({
            path: reportKey(context, shard),
            body: `${JSON.stringify(report, null, 2)}\n`,
        })),
        {
            path: indexKey(context),
            body: isRollingIndex(context)
                ? appendIndexRows(options.existingIndex ?? '', rows)
                : renderNdjson(rows),
        },
    ];

    if (options.sealBaseline) {
        files.push({
            path: baselineKey(context.branch),
            body: `${JSON.stringify(toBaselineDocument(reports, context), null, 2)}\n`,
        });
    }

    return files;
};
