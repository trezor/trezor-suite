import { roundMetric } from './aggregate';
import { formatMetricValue } from './report';
import type { PerformanceReport, PerformanceScreenReport } from './types';

/**
 * The run's report as a GitHub job summary.
 *
 * Kept apart from the step that writes it so the rendering is reachable from a test, and so it
 * reads the same typed report the rest of this directory builds rather than re-deriving the shape
 * from raw JSON.
 */

export type PerformanceSummary = {
    /** Markdown for `GITHUB_STEP_SUMMARY`. */
    markdown: string;
    /**
     * What went over its limit — scenario names, or `aggregate` where the overall score did. Empty
     * when nothing did. Reported, never fatal: a performance number does not decide a run.
     */
    overLimit: string[];
};

const TABLE_HEADER = [
    '| Screen | Samples | Metric | Current | Limit | % of limit | |',
    '| --- | ---: | --- | ---: | ---: | ---: | --- |',
];

const formatRatio = (ratioToLimit: number | null): string =>
    ratioToLimit === null ? 'n/a' : `${Math.round(ratioToLimit * 100)}%`;

const formatMeta = (report: PerformanceReport): string =>
    [
        report.meta.platform,
        report.meta.device,
        report.meta.appVersion,
        report.meta.commitHash.slice(0, 7),
        report.meta.sampleCount > 0 ? `${report.meta.sampleCount} samples` : '',
    ]
        .filter(Boolean)
        .join(' - ') || 'no run metadata';

const toRow = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;

const formatScreenRows = (screen: PerformanceScreenReport): string[] =>
    screen.metrics.map(metric =>
        toRow([
            screen.scenario,
            String(screen.sampleCount),
            metric.label,
            formatMetricValue(metric.current, metric.unit),
            formatMetricValue(metric.limit, metric.unit),
            formatRatio(metric.ratioToLimit),
            metric.exceededLimit ? 'over limit' : '',
        ]),
    );

export const summarizeReport = (report: PerformanceReport, shard: string): PerformanceSummary => {
    const overLimit = [
        ...report.screens.filter(screen => screen.overLimit).map(screen => screen.scenario),
        ...(report.aggregate.overLimit ? ['aggregate'] : []),
    ];

    const lines = [
        `### Native E2E performance (shard ${shard})`,
        '',
        formatMeta(report),
        '',
        ...TABLE_HEADER,
        ...report.screens.flatMap(formatScreenRows),
        '',
        `Aggregate score: ${report.aggregate.score === null ? 'n/a' : roundMetric(report.aggregate.score)}`,
        ...(overLimit.length > 0
            ? ['', `Over limit: ${overLimit.join(', ')}. Reported only, this never fails the run.`]
            : []),
    ];

    return { markdown: `${lines.join('\n')}\n`, overLimit };
};
