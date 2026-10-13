import * as path from 'path';

import type { PerfRun, PerfRunContext, PerfRunIdentity, PerfSurface } from '@trezor/perf-e2e';
import { listShardDirectories, readJsonFile } from '@trezor/perf-e2e';

import type { PerformanceReport } from './types';

/**
 * Maps the mobile shards' reports onto the shared performance store (`@trezor/perf-e2e`); only a
 * native report's screens and its `ttff/tti/fid` keys are specific to mobile.
 */

const ARTIFACT_DIR_PATTERN = /^android-perf-report-(.+)$/;

/** Namespaced so a mobile time-to-interactive can never be compared against a web Lighthouse one. */
const METRIC_PREFIX = 'rn';

/** One report covers every screen of a shard, so all its measurements share a single artifact. */
const ARTIFACT_NAME = 'report';

export type ShardReport = { shard: string; report: PerformanceReport };

const isReport = (value: unknown): value is PerformanceReport =>
    typeof value === 'object' &&
    value !== null &&
    !!(value as PerformanceReport).meta &&
    Array.isArray((value as PerformanceReport).screens);

export const collectShardReports = (artifactsDir: string): ShardReport[] =>
    listShardDirectories(artifactsDir, ARTIFACT_DIR_PATTERN).flatMap(({ shard, directory }) => {
        const report = readJsonFile(path.join(directory, 'perf-report.json'));

        return isReport(report) ? [{ shard, report }] : [];
    });

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
    identity: PerfRunIdentity,
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

export const collectRuns = (artifactsDir: string, identity: PerfRunIdentity): PerfRun[] =>
    collectShardReports(artifactsDir).flatMap(
        shardReport => toPerfRun(shardReport, identity) ?? [],
    );
