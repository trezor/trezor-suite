/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import type { PerfRun, PerfRunContext, PerfSurface, PerfUploadFile } from '@trezor/perf-e2e';
import {
    STORE_PREFIX,
    buildUploadBundle,
    fetchStoreText,
    indexKey,
    isRollingIndex,
    publicUrl,
} from '@trezor/perf-e2e';

import type { PerformanceReport } from './types';

/**
 * The mobile adapter onto the shared performance store (`@trezor/perf-e2e`): it turns the reports
 * the shards of one run produced into the tree of objects that goes to S3, so the upload itself is
 * one `aws s3 cp --recursive` in the workflow.
 *
 * The web and desktop Lighthouse pipelines write the same envelope through the same builder; only
 * this mapping — a native report's screens and its `ttff/tti/fid` keys — is specific to mobile.
 *
 * Publishing is a side effect of the run, never a precondition: every failure mode ends in a
 * printed status and exit 0.
 */

/** Shards upload `android-perf-report-<shard>`, so the directory name carries the shard. */
const ARTIFACT_DIR_PATTERN = /^android-perf-report-(.+)$/;

/** Namespaced so a mobile time-to-interactive can never be compared against a web Lighthouse one. */
const METRIC_PREFIX = 'rn';

/** One report covers every screen of a shard, so all its measurements share a single artifact. */
const ARTIFACT_NAME = 'report';

export type ShardReport = { shard: string; report: PerformanceReport };

const readJson = <T>(filePath: string): T | null => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch {
        return null;
    }
};

/**
 * `GITHUB_HEAD_REF` is set on pull requests only and is the branch under test; `GITHUB_REF_NAME` is
 * the branch on a push or a schedule. Outside CI both are empty and publishing is skipped.
 */
export const resolveRunIdentity = (env: Record<string, string | undefined>) => {
    const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
    const sha = env.PERF_SHA || env.GITHUB_SHA;

    if (!branch || !sha) {
        return null;
    }

    return {
        branch,
        sha,
        runId: env.GITHUB_RUN_ID ?? 'local',
        runAttempt: env.GITHUB_RUN_ATTEMPT ?? '1',
        ...(env.PERF_PR_NUMBER ? { prNumber: env.PERF_PR_NUMBER } : {}),
        ...(env.PERF_RUN_URL ? { runUrl: env.PERF_RUN_URL } : {}),
    };
};

/**
 * Every downloaded artifact that holds a readable report. A shard that produced none simply
 * contributes no entry.
 */
export const collectShardReports = (artifactsDir: string): ShardReport[] => {
    if (!fs.existsSync(artifactsDir)) {
        return [];
    }

    return fs
        .readdirSync(artifactsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const shard = ARTIFACT_DIR_PATTERN.exec(entry.name)?.[1];
            const report = readJson<PerformanceReport>(
                path.join(artifactsDir, entry.name, 'perf-report.json'),
            );

            return shard && report?.meta && Array.isArray(report.screens)
                ? [{ shard, report }]
                : [];
        })
        .toSorted((a, b) => a.shard.localeCompare(b.shard));
};

/**
 * `unknown` means the Detox configuration did not say which platform ran, and a run that cannot be
 * attributed to a surface is skipped rather than filed under a guess — a wrong label would poison
 * that surface's trend, while a missing run only leaves a gap.
 */
const toSurface = (report: PerformanceReport): PerfSurface | null => {
    switch (report.meta.platform) {
        case 'android':
            return 'android';
        case 'ios':
            return 'ios';
        default:
            return null;
    }
};

export const toPerfRun = (
    { shard, report }: ShardReport,
    identity: NonNullable<ReturnType<typeof resolveRunIdentity>>,
): PerfRun | null => {
    const surface = toSurface(report);

    if (!surface) {
        return null;
    }

    const context: PerfRunContext = {
        ...identity,
        surface,
        shard,
        generatedAt: report.meta.generatedAt,
        env: { device: report.meta.device, appVersion: report.meta.appVersion },
    };

    return {
        context,
        artifacts: [
            {
                kind: 'native-report',
                name: ARTIFACT_NAME,
                body: `${JSON.stringify(report, null, 2)}\n`,
            },
        ],
        measurements: report.screens.map(screen => ({
            scenario: screen.scenario,
            samples: screen.sampleCount,
            metrics: Object.fromEntries(
                screen.metrics.map(metric => [`${METRIC_PREFIX}:${metric.key}`, metric.current]),
            ),
            artifact: ARTIFACT_NAME,
        })),
    };
};

const writeBundle = (root: string, files: readonly PerfUploadFile[]): void => {
    fs.rmSync(root, { recursive: true, force: true });

    for (const file of files) {
        const target = path.join(root, file.path);

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.body);
    }
};

export const publishPerformanceHistory = async (): Promise<void> => {
    const artifactsDir = path.resolve(process.env.PERF_ARTIFACTS_DIR ?? 'perf-artifacts');
    const bundleRoot = path.resolve(process.env.PERF_BUNDLE_DIR ?? 'perf-upload');
    const shardReports = collectShardReports(artifactsDir);
    const identity = resolveRunIdentity(process.env);

    if (shardReports.length === 0) {
        console.log(`[performance] No shard reports under ${artifactsDir}; nothing to publish.`);

        return;
    }
    if (!identity) {
        console.log('[performance] No branch or commit in the environment; nothing to publish.');

        return;
    }

    const runs = shardReports.flatMap(shardReport => toPerfRun(shardReport, identity) ?? []);
    const [first] = runs;

    if (!first) {
        console.log('[performance] No run could be attributed to a platform; nothing to publish.');

        return;
    }

    // A branch appends to one rolling index, so what is already there is read back first — over
    // plain HTTPS, because the objects are public. Absent is the normal state of a first run.
    const indexUrl = publicUrl(indexKey(first.context));
    const existing = isRollingIndex(first.context)
        ? await fetchStoreText(indexUrl)
        : ({ status: 'absent' } as const);

    if (existing.status === 'unavailable') {
        console.log(
            `[performance] Could not read ${indexUrl} (${existing.reason}); writing a fresh index.`,
        );
    }

    const files = buildUploadBundle(runs, {
        existingIndex: existing.status === 'ok' ? existing.text : '',
        // Only a run on the base branch seals what later runs are compared against.
        sealBaseline: process.env.PERF_SEAL_BASELINE === 'true',
    });

    writeBundle(bundleRoot, files);

    console.log(
        `[performance] ${runs.length} shard run(s) → ${files.length} object(s) under ${STORE_PREFIX}:`,
    );
    for (const file of files) {
        console.log(`  ${file.path}`);
    }
    console.log(`[performance] Index: ${indexUrl}`);
};
