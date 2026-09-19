/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import type { PerfHistoryFile } from '@trezor/perf-e2e';
import {
    historyToPerfRun,
    mergeHistories,
    publishRuns,
    resolveRunIdentity,
} from '@trezor/perf-e2e';

/**
 * The web and desktop adapter onto the shared performance store (`@trezor/perf-e2e`). The mobile
 * pipeline writes the same envelope through the same publisher; only this mapping — scenarios,
 * device-model variants and the in-page metric keys — is specific to the browser runs.
 */

/** Shards upload `web-perf-history-<target>-<group>`, so the directory name carries the shard. */
const ARTIFACT_DIR_PATTERN = /^perf-history-(.+)$/;

export type ShardHistory = { shard: string; history: PerfHistoryFile };

const readJson = <T>(filePath: string): T | null => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    } catch {
        return null;
    }
};

const readHistories = (directory: string): PerfHistoryFile[] =>
    fs
        .readdirSync(directory)
        .filter(name => name.endsWith('.json'))
        .flatMap(name => {
            const history = readJson<PerfHistoryFile>(path.join(directory, name));

            return history?.surface && Array.isArray(history.measurements) ? [history] : [];
        });

/**
 * Every downloaded artifact that holds at least one readable history. A shard reports in batches, so
 * it may have left several documents, and they are merged into the one run that shard measured.
 */
export const collectShardHistories = (artifactsDir: string): ShardHistory[] => {
    if (!fs.existsSync(artifactsDir)) {
        return [];
    }

    return fs
        .readdirSync(artifactsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const shard = ARTIFACT_DIR_PATTERN.exec(entry.name)?.[1];
            const history = shard
                ? mergeHistories(readHistories(path.join(artifactsDir, entry.name)))
                : null;

            return shard && history ? [{ shard, history }] : [];
        })
        .toSorted((a, b) => a.shard.localeCompare(b.shard));
};

export const publishPerformanceHistory = async (): Promise<void> => {
    const artifactsDir = path.resolve(process.env.PERF_ARTIFACTS_DIR ?? 'perf-artifacts');
    const bundleRoot = path.resolve(process.env.PERF_BUNDLE_DIR ?? 'perf-upload');
    const histories = collectShardHistories(artifactsDir);
    const identity = resolveRunIdentity(process.env);

    if (histories.length === 0) {
        console.log(`[performance] No shard histories under ${artifactsDir}; nothing to publish.`);

        return;
    }
    if (!identity) {
        console.log('[performance] No branch or commit in the environment; nothing to publish.');

        return;
    }

    const outcome = await publishRuns({
        runs: histories.flatMap(
            ({ shard, history }) => historyToPerfRun(shard, history, identity) ?? [],
        ),
        bundleRoot,
        // Only a run on the base branch seals what later runs are compared against.
        sealBaseline: process.env.PERF_SEAL_BASELINE === 'true',
    });

    if (outcome.status === 'skipped') {
        console.log(`[performance] Nothing published: ${outcome.reason}.`);
    }
};
