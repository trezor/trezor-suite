import {
    type MetricComparison,
    type MetricUnit,
    type PerfMetricKey,
    type ScenarioComparison,
} from './types';

/**
 * What each unit is written as after the number. A count is just the number — `20 count` reads as
 * neither English nor a measurement. Keyed by unit so a new one cannot be left unhandled.
 */
const UNIT_SUFFIX: Record<MetricUnit, string> = {
    ms: ' ms',
    count: '',
};

/** `null` is a metric this environment could not measure, which is not the same as a zero. */
export const formatMetricValue = (value: number | null, unit: MetricUnit): string => {
    if (value === null) {
        return 'n/a';
    }

    const rounded = Math.round(value * 10) / 10;

    return `${rounded}${UNIT_SUFFIX[unit]}`;
};

const formatMetricBlock = (metric: MetricComparison): string =>
    [
        metric.label,
        `limit   : ${formatMetricValue(metric.limit, metric.unit)}`,
        `current : ${formatMetricValue(metric.current, metric.unit)}`,
        `baseline: ${formatMetricValue(metric.baseline, metric.unit)} (not enforced)`,
    ].join('\n');

/**
 * Also returns a compact summary when nothing failed, so the numbers stay visible in passing runs.
 */
export const formatHumanReport = (comparison: ScenarioComparison): string => {
    if (!comparison.overLimit) {
        const summary = comparison.metrics
            .map(
                metric =>
                    `  ${metric.label}: ${formatMetricValue(metric.current, metric.unit)}` +
                    (metric.limit !== null
                        ? ` (limit ${formatMetricValue(metric.limit, metric.unit)})`
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
        key: PerfMetricKey;
        label: string;
        unit: MetricUnit;
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
