/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import type { FlowDocument, PerfHistoryFile } from '@trezor/perf-e2e';
import {
    historyToPerfRun,
    isFlowDocument,
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

export type ShardHistory = { shard: string; history: PerfHistoryFile; flows: FlowDocument[] };

const readJson = (filePath: string): unknown => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    } catch {
        return null;
    }
};

const isHistoryFile = (value: unknown): value is PerfHistoryFile =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PerfHistoryFile).surface === 'string' &&
    Array.isArray((value as PerfHistoryFile).measurements);

/**
 * A shard leaves two kinds of document side by side: the medians our instrumentation measured, and
 * a Lighthouse flow per profiled test. They are told apart by shape, and anything else in the
 * directory is ignored rather than guessed at.
 */
const readDocuments = (directory: string) => {
    const documents = fs
        .readdirSync(directory)
        .filter(name => name.endsWith('.json'))
        .map(name => readJson(path.join(directory, name)));

    return {
        histories: documents.filter(isHistoryFile),
        flows: documents.filter(isFlowDocument),
    };
};

/**
 * Every downloaded artifact that holds at least one readable document. A shard reports in batches, so
 * it may have left several, and they are merged into the one run that shard measured. Flow documents
 * are kept as a list: each is its own artifact, and merging them would throw away all but one.
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

            if (!shard) {
                return [];
            }

            const { histories, flows } = readDocuments(path.join(artifactsDir, entry.name));
            const [firstFlow] = flows;
            // A profiled shard whose scenarios our own instrumentation never measured still has
            // something to publish — today that is every web shard, which is not instrumented.
            const history =
                mergeHistories(histories) ??
                (firstFlow
                    ? {
                          surface: firstFlow.surface,
                          generatedAt: firstFlow.generatedAt,
                          measurements: [],
                      }
                    : null);

            return history ? [{ shard, history, flows }] : [];
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
            ({ shard, history, flows }) => historyToPerfRun(shard, history, identity, flows) ?? [],
        ),
        bundleRoot,
        // Only a run on the base branch seals what later runs are compared against.
        sealBaseline: process.env.PERF_SEAL_BASELINE === 'true',
    });

    if (outcome.status === 'skipped') {
        console.log(`[performance] Nothing published: ${outcome.reason}.`);
    }
};
