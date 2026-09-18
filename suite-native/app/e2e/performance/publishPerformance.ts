/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import { fetchText } from './baseline';
import type { PerfStoreContext, ShardReport, UploadFile } from './store';
import { STORE_PREFIX, buildUploadBundle, indexKey, isRollingIndex, publicUrl } from './store';
import type { PerformanceReport } from './types';

/**
 * Turns the reports the shards of one run produced into the tree of objects that goes to S3, so the
 * upload itself is one `aws s3 cp --recursive` in the workflow — see the "Publish performance
 * history" job of `test-suite-native-e2e-android.yml`.
 *
 * One job publishes a whole run: the shards only upload their artifacts, so nothing here races with
 * a sibling. Publishing is a side effect of the run, never a precondition — every failure mode ends
 * in a printed status and exit 0.
 */

/** Shards upload `android-perf-report-<shard>`, so the directory name carries the shard. */
const ARTIFACT_DIR_PATTERN = /^android-perf-report-(.+)$/;

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
export const resolveStoreContext = (env: NodeJS.ProcessEnv): PerfStoreContext | null => {
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
 * Every downloaded artifact that holds a readable report, newest shard order irrelevant. A shard
 * that produced nothing (no @perf screens in its group) simply contributes no entry.
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

const writeBundle = (root: string, files: readonly UploadFile[]): void => {
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
    const reports = collectShardReports(artifactsDir);

    if (reports.length === 0) {
        console.log(`[performance] No shard reports under ${artifactsDir}; nothing to publish.`);

        return;
    }

    const context = resolveStoreContext(process.env);

    if (!context) {
        console.log('[performance] No branch or commit in the environment; nothing to publish.');

        return;
    }

    // A branch appends to one rolling index, so what is already there is read back first — over
    // plain HTTPS, because the objects are public. Absent is the normal state of the first run.
    const indexUrl = publicUrl(indexKey(context));
    const existing = isRollingIndex(context)
        ? await fetchText(indexUrl)
        : { status: 'absent' as const };

    if (existing.status === 'unavailable') {
        console.log(
            `[performance] Could not read ${indexUrl} (${existing.reason}); writing a fresh index.`,
        );
    }

    const files = buildUploadBundle(reports, context, {
        existingIndex: existing.status === 'ok' ? existing.text : '',
        // Only a baseline run seals what later PRs are compared against, and only for its branch.
        sealBaseline: process.env.PERF_SEAL_BASELINE === 'true',
    });

    writeBundle(bundleRoot, files);

    console.log(
        `[performance] ${reports.length} shard report(s) → ${files.length} object(s) under ${STORE_PREFIX}:`,
    );
    for (const file of files) {
        console.log(`  ${file.path}`);
    }
    console.log(`[performance] Index: ${indexUrl}`);
};
