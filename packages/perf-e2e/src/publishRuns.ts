/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import type { PerfRun, PerfRunContext, PerfUploadFile } from './store';
import { STORE_PREFIX, buildUploadBundle, indexKey, isRollingIndex, publicUrl } from './store';
import { fetchStoreText } from './storeReader';

/**
 * The half of publishing that every surface shares: who the run is, reading back the rolling index,
 * and writing the bundle to disk for `aws s3 cp --recursive` to upload.
 *
 * A surface supplies only its own mapping — shard artifacts in, `PerfRun[]` out. Mobile maps a
 * Detox report, the web and desktop e2e map their scenario comparisons, and a Lighthouse run maps
 * its flow results; none of them need to know the key scheme.
 *
 * Publishing is a side effect of a run, never a precondition: every failure ends in a printed
 * status rather than an exception.
 */

/** What a run is, before a surface adds itself to it. */
export type PerfRunIdentity = Pick<
    PerfRunContext,
    'branch' | 'sha' | 'runId' | 'runAttempt' | 'prNumber' | 'runUrl'
>;

/**
 * `GITHUB_HEAD_REF` is set on pull requests only and is the branch under test; `GITHUB_REF_NAME` is
 * the branch on a push or a schedule. Outside CI both are empty and publishing is skipped.
 */
export const resolveRunIdentity = (
    env: Record<string, string | undefined>,
): PerfRunIdentity | null => {
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

export const writeBundle = (root: string, files: readonly PerfUploadFile[]): void => {
    fs.rmSync(root, { recursive: true, force: true });

    for (const file of files) {
        const target = path.join(root, file.path);

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.body);
    }
};

export type PublishOutcome =
    | { status: 'written'; files: PerfUploadFile[]; indexUrl: string }
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

    // A branch appends to one rolling index, so what is already there is read back first — over
    // plain HTTPS, because the objects are public. Absent is the normal state of a first run.
    const indexUrl = publicUrl(indexKey(first.context));
    const existing = isRollingIndex(first.context)
        ? await fetchStoreText(indexUrl)
        : ({ status: 'absent' } as const);

    if (existing.status === 'unavailable') {
        log(
            `[performance] Could not read ${indexUrl} (${existing.reason}); writing a fresh index.`,
        );
    }

    const files = buildUploadBundle(runs, {
        existingIndex: existing.status === 'ok' ? existing.text : '',
        sealBaseline,
    });

    writeBundle(bundleRoot, files);

    log(`[performance] ${runs.length} run(s) → ${files.length} object(s) under ${STORE_PREFIX}:`);
    for (const file of files) {
        log(`  ${file.path}`);
    }
    log(`[performance] Index: ${indexUrl}`);

    return { status: 'written', files, indexUrl };
};
