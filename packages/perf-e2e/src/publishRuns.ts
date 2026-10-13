/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import type { PerfRun, PerfRunContext, PerfUploadFile } from './store';
import { STORE_PREFIX, buildUploadBundle, indexKey, isRollingIndex, publicUrl } from './store';
import { fetchStoreText } from './storeReader';

/**
 * The half of publishing that every platform shares: who the run is, reading back the rolling index,
 * and writing the bundle to disk for `aws s3 cp --recursive` to upload.
 *
 * A platform supplies only its own mapping — shard artifacts in, `PerfRun[]` out. Mobile maps a
 * Detox report, the web and desktop e2e map their scenario comparisons, and a Lighthouse run maps
 * its flow results; none of them need to know the key scheme.
 *
 * Publishing is a side effect of a run, never a precondition: every failure ends in a printed
 * status rather than an exception.
 */

/** What a run is, before a platform adds itself to it. */
export type PerfRunIdentity = Pick<
    PerfRunContext,
    'branch' | 'commitId' | 'runId' | 'runAttempt' | 'prNumber' | 'runUrl'
>;

/**
 * `GITHUB_HEAD_REF` is set on pull requests only and is the branch under test; `GITHUB_REF_NAME` is
 * the branch on a push or a schedule. Outside CI both are empty and publishing is skipped.
 */
export const resolveRunIdentity = (
    env: Record<string, string | undefined>,
): PerfRunIdentity | null => {
    const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
    const commitId = env.PERF_COMMIT_ID || env.GITHUB_SHA;

    if (!branch || !commitId) {
        return null;
    }

    return {
        branch,
        commitId,
        runId: env.GITHUB_RUN_ID ?? 'local',
        runAttempt: env.GITHUB_RUN_ATTEMPT ?? '1',
        ...(env.PERF_PR_NUMBER ? { prNumber: env.PERF_PR_NUMBER } : {}),
        ...(env.PERF_RUN_URL ? { runUrl: env.PERF_RUN_URL } : {}),
    };
};

export const readJsonFile = (filePath: string): unknown => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    } catch {
        return null;
    }
};

/**
 * Each shard uploads one artifact named `<prefix>-<shard>`; `pattern` captures the shard. A missing
 * directory means nothing was downloaded.
 */
export const listShardDirectories = (
    artifactsDir: string,
    pattern: RegExp,
): { shard: string; directory: string }[] => {
    if (!fs.existsSync(artifactsDir)) {
        return [];
    }

    // A `g` or `y` flag makes `exec` resume from the previous match, skipping every other shard.
    const shardPattern = new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));

    return fs
        .readdirSync(artifactsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const shard = shardPattern.exec(entry.name)?.[1];

            return shard ? [{ shard, directory: path.join(artifactsDir, entry.name) }] : [];
        })
        .toSorted((a, b) => a.shard.localeCompare(b.shard));
};

export const writeBundle = (root: string, files: readonly PerfUploadFile[]): void => {
    fs.rmSync(root, { recursive: true, force: true });

    for (const file of files) {
        const target = path.join(root, file.path);

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.body);
    }
};

export type PublishOutcome =
    | { status: 'written'; files: PerfUploadFile[]; indexUrls: string[] }
    | { status: 'skipped'; reason: string };

export const publishRuns = async ({
    runs,
    bundleRoot,
    sealBaseline = false,
    log = console.log,
}: {
    runs: readonly PerfRun[];
    bundleRoot: string;
    sealBaseline?: boolean;
    log?: (message: string) => void;
}): Promise<PublishOutcome> => {
    const [first] = runs;

    if (!first) {
        return { status: 'skipped', reason: 'no runs to publish' };
    }

    // A branch appends to its rolling index, so what is already there is read back first — over
    // plain HTTPS, because the objects are public. Absent is the normal state of a first run.
    //
    // One publish can cover several platforms, and each keeps its own index, so every one of them is
    // read separately. Reading a single file and reusing its contents for the rest would write one
    // platform's history into another platform's index.
    const indexKeys = [...new Set(runs.map(run => indexKey(run.context)))];
    const rollingKeys = [
        ...new Set(
            runs.filter(run => isRollingIndex(run.context)).map(run => indexKey(run.context)),
        ),
    ];
    const existingIndex: Record<string, string> = {};
    const unreadableKeys = new Set<string>();

    for (const key of rollingKeys) {
        const url = publicUrl(key);
        const existing = await fetchStoreText(url);

        if (existing.status === 'ok') {
            existingIndex[key] = existing.text;
        } else if (existing.status === 'unavailable') {
            // Writing it anyway would replace the branch's whole history with this one run.
            unreadableKeys.add(key);
            log(
                `::warning::[performance] Could not read ${url} (${existing.reason}); its index is not updated by this run.`,
            );
        }
    }

    const files = buildUploadBundle(runs, { existingIndex, sealBaseline }).filter(
        file => !unreadableKeys.has(file.path),
    );

    writeBundle(bundleRoot, files);

    log(`[performance] ${runs.length} run(s) → ${files.length} object(s) under ${STORE_PREFIX}:`);
    for (const file of files) {
        log(`  ${file.path}`);
    }
    const indexUrls = indexKeys.filter(key => !unreadableKeys.has(key)).map(publicUrl);

    for (const url of indexUrls) {
        log(`[performance] Index: ${url}`);
    }

    return { status: 'written', files, indexUrls };
};

/**
 * The CI entry point of every platform: reads the job's environment, lets the platform map its
 * downloaded shard artifacts to runs, and writes the bundle. Never throws, so it can never fail
 * the job.
 */
export const publishFromCi = async (
    collectRuns: (artifactsDir: string, identity: PerfRunIdentity) => PerfRun[],
): Promise<void> => {
    try {
        const identity = resolveRunIdentity(process.env);

        if (!identity) {
            console.log(
                '[performance] No branch or commit in the environment; nothing to publish.',
            );

            return;
        }

        const artifactsDir = path.resolve(process.env.PERF_ARTIFACTS_DIR || 'perf-artifacts');
        const outcome = await publishRuns({
            runs: collectRuns(artifactsDir, identity),
            bundleRoot: path.resolve(process.env.PERF_BUNDLE_DIR || 'perf-upload'),
            sealBaseline: process.env.PERF_SEAL_BASELINE === 'true',
        });

        if (outcome.status === 'skipped') {
            console.log(`[performance] Nothing published from ${artifactsDir}: ${outcome.reason}.`);
        }
    } catch (error) {
        console.log(
            `[performance] Publishing failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};
