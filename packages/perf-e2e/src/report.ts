import { type MetricComparison, type ScenarioComparison } from './types';

const formatValue = (value: number | null, unit: string): string => {
    if (value === null) {
        return 'n/a';
    }
    const rounded = Math.round(value * 10) / 10;

    return unit === 'ms' ? `${rounded} ms` : `${rounded}`;
};

const formatMetricBlock = (metric: MetricComparison): string =>
    [
        metric.label,
        `limit   : ${formatValue(metric.limit, metric.unit)}`,
        `current : ${formatValue(metric.current, metric.unit)}`,
        `baseline: ${formatValue(metric.baseline, metric.unit)} (not enforced)`,
    ].join('\n');

/**
 * Also returns a compact summary when nothing failed, so the numbers stay visible in passing runs.
 */
export const formatHumanReport = (comparison: ScenarioComparison): string => {
    if (!comparison.overLimit) {
        const summary = comparison.metrics
            .map(
                metric =>
                    `  ${metric.label}: ${formatValue(metric.current, metric.unit)}` +
                    (metric.limit !== null
                        ? ` (limit ${formatValue(metric.limit, metric.unit)})`
                        : ' (no limit)'),
            )
            .join('\n');

        const heading = comparison.unlimited
            ? 'Performance measured, no limits set for this scenario'
            : 'Performance within limits';

        return `${heading}\n\nScenario:\n${comparison.scenario}\n\nMetrics:\n${summary}`;
    }

    const body = comparison.metrics
        .filter(metric => metric.exceededLimit)
        .map(formatMetricBlock)
        .join('\n\n');

    return `Performance OVER LIMIT (reported, does not fail the run)\n\nScenario:\n${comparison.scenario}\n\nMetrics:\n\n${body}`;
};

export type PerfJsonReport = {
    scenario: string;
    overLimit: boolean;
    unlimited: boolean;
    metrics: Array<{
        key: string;
        label: string;
        unit: string;
        baseline: number | null;
        current: number | null;
        limit: number | null;
        ratioToLimit: number | null;
        exceededLimit: boolean;
    }>;
};

/**
 * The machine-readable artifact attached to the Playwright output. It contains everything needed to
 * understand a verdict: the collected metrics, the limits they were held to, and the baseline they
 * are read against.
 */
export const buildJsonReport = (comparison: ScenarioComparison): PerfJsonReport => ({
    scenario: comparison.scenario,
    overLimit: comparison.overLimit,
    unlimited: comparison.unlimited,
    metrics: comparison.metrics.map(metric => ({
        key: metric.key,
        label: metric.label,
        unit: metric.unit,
        baseline: metric.baseline,
        current: metric.current,
        limit: metric.limit,
        ratioToLimit: metric.ratioToLimit,
        exceededLimit: metric.exceededLimit,
    })),
});
