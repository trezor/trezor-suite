import * as fs from 'fs';
import * as path from 'path';

import type { FlowDocument, PerfHistoryFile, PerfRun, PerfRunIdentity } from '@trezor/perf-e2e';
import {
    historyToPerfRun,
    isFlowDocument,
    listShardDirectories,
    mergeHistories,
    readJsonFile,
} from '@trezor/perf-e2e';

/**
 * Maps the web and desktop shards' documents onto the shared performance store
 * (`@trezor/perf-e2e`); only scenarios, device-model variants and the in-page metric keys are
 * specific to the browser runs.
 */

const ARTIFACT_DIR_PATTERN = /^perf-history-(.+)$/;

export type ShardHistory = { shard: string; history: PerfHistoryFile; flows: FlowDocument[] };

const isHistoryFile = (value: unknown): value is PerfHistoryFile =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PerfHistoryFile).surface === 'string' &&
    Array.isArray((value as PerfHistoryFile).measurements);

/** Our medians and a Lighthouse flow per profiled test sit side by side, told apart by shape. */
const readDocuments = (directory: string) => {
    const documents = fs
        .readdirSync(directory)
        .filter(name => name.endsWith('.json'))
        .map(name => readJsonFile(path.join(directory, name)));

    return {
        histories: documents.filter(isHistoryFile),
        flows: documents.filter(isFlowDocument),
    };
};

/**
 * A shard reports in batches, so its histories are merged into the one run it measured. Flow
 * documents stay a list: each is its own artifact.
 */
export const collectShardHistories = (artifactsDir: string): ShardHistory[] =>
    listShardDirectories(artifactsDir, ARTIFACT_DIR_PATTERN).flatMap(({ shard, directory }) => {
        const { histories, flows } = readDocuments(directory);
        const [firstFlow] = flows;
        // A profiled shard our instrumentation never measured (every web shard today) still has
        // its flows to publish.
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
    });

export const collectRuns = (artifactsDir: string, identity: PerfRunIdentity): PerfRun[] =>
    collectShardHistories(artifactsDir).flatMap(
        ({ shard, history, flows }) => historyToPerfRun(shard, history, identity, flows) ?? [],
    );
