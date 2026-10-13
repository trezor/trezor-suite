import { PERFORMANCE_METRIC_DEFINITIONS } from './metrics';
import type {
    PerformanceMetricDefinition,
    PerformanceMetricKey,
    PerformanceMetricRow,
    PerformanceMetricValues,
    PerformanceScreenReport,
    ScreenLimits,
} from './types';

const resolveLimit = (limits: ScreenLimits | undefined, key: PerformanceMetricKey) =>
    key === 'lighthouseScore' ? undefined : limits?.[key];

/**
 * Holds a metric against its limit. The baseline travels with the result for the report to show and
 * has no say in it: a metric is over budget when it costs more than the app is allowed to cost, not
 * when it costs more than it used to.
 */
export const compareMetric = (
    definition: PerformanceMetricDefinition,
    baseline: number | undefined,
    limit: number | undefined,
    current: number | null,
): PerformanceMetricRow => {
    const row = {
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        baseline: baseline ?? null,
        current,
        limit: limit ?? null,
    };

    // Not measured this run, or no limit for it. Reported either way, never enforced.
    if (current === null || limit === undefined) {
        return { ...row, ratioToLimit: null, exceededLimit: false };
    }

    return {
        ...row,
        ratioToLimit: limit > 0 ? current / limit : null,
        exceededLimit: current > limit,
    };
};

export const compareScreen = ({
    scenario,
    sampleCount,
    current,
    baseline,
    limits,
    definitions = PERFORMANCE_METRIC_DEFINITIONS,
}: {
    scenario: string;
    sampleCount: number;
    current: PerformanceMetricValues;
    baseline: Partial<PerformanceMetricValues> | undefined;
    limits: ScreenLimits | undefined;
    definitions?: readonly PerformanceMetricDefinition[];
}): PerformanceScreenReport => {
    const metrics = definitions.map(definition =>
        // A null recorded baseline means "none" for that metric, same as absent.
        compareMetric(
            definition,
            baseline?.[definition.key] ?? undefined,
            resolveLimit(limits, definition.key),
            current[definition.key],
        ),
    );

    return {
        scenario,
        overLimit: metrics.some(metric => metric.exceededLimit),
        unlimited: metrics.every(metric => metric.limit === null),
        sampleCount,
        metrics,
    };
};
