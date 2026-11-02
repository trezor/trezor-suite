import { METRIC_DEFINITIONS } from './config';
import {
    type MetricComparison,
    type MetricDefinition,
    type MetricUnit,
    type PerfMetrics,
    type ScenarioComparison,
    type ScenarioLimits,
} from './types';

/**
 * Holds a metric against its limit. The baseline travels with the result for the report to show and
 * has no say in it: a metric is over budget when it costs more than the app is allowed to cost, not
 * when it costs more than it used to.
 */
export const compareMetric = <K extends string, U extends MetricUnit>(
    definition: MetricDefinition<K, U>,
    baseline: number | undefined,
    limit: number | undefined,
    current: number | null,
): MetricComparison<K, U> => {
    const comparison = {
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        baseline: baseline ?? null,
        current,
        limit: limit ?? null,
    };

    // Not measured this run, or no limit for it. Reported either way, never enforced.
    if (current === null || limit === undefined) {
        return { ...comparison, ratioToLimit: null, exceededLimit: false };
    }

    return {
        ...comparison,
        ratioToLimit: limit > 0 ? current / limit : null,
        exceededLimit: current > limit,
    };
};

type CompareScenarioMetricsParams<K extends string, U extends MetricUnit> = {
    scenario: string;
    current: Record<K, number | null>;
    baseline: Partial<Record<K, number | null>> | undefined;
    limits: Partial<Record<K, number | null>> | undefined;
    definitions: readonly MetricDefinition<K, U>[];
};

/** `compareScenario` over any metric set, for a report whose metrics are not the browser ones. */
export const compareScenarioMetrics = <K extends string, U extends MetricUnit>({
    scenario,
    current,
    baseline,
    limits,
    definitions,
}: CompareScenarioMetricsParams<K, U>): ScenarioComparison<K, U> => {
    const metrics = definitions.map(definition =>
        // A null recorded baseline or limit means "none" for that metric, same as absent.
        compareMetric(
            definition,
            baseline?.[definition.key] ?? undefined,
            limits?.[definition.key] ?? undefined,
            current[definition.key],
        ),
    );

    return {
        scenario,
        metrics,
        overLimit: metrics.some(metric => metric.exceededLimit),
        unlimited: metrics.every(metric => metric.limit === null),
    };
};

export const compareScenario = (
    scenario: string,
    current: PerfMetrics,
    baseline: Partial<PerfMetrics> | undefined,
    limits: ScenarioLimits | undefined,
    definitions: readonly MetricDefinition[] = METRIC_DEFINITIONS,
): ScenarioComparison =>
    compareScenarioMetrics({ scenario, current, baseline, limits, definitions });
