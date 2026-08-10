import { METRIC_DEFINITIONS } from './config';
import {
    type Baselines,
    type Limits,
    type MetricComparison,
    type MetricDefinition,
    type PerfMetrics,
    type ScenarioComparison,
    type ScenarioLimits,
} from './types';

/**
 * Holds a metric against its limit. The baseline travels with the result for the report to show and
 * has no say in the verdict: a run fails when it costs more than the app is allowed to cost, not
 * when it costs more than it used to.
 */
export const compareMetric = (
    definition: MetricDefinition,
    baseline: number | undefined,
    limit: number | undefined,
    current: number | null,
): MetricComparison => {
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
        return {
            ...comparison,
            ratioToBaseline:
                current !== null && baseline !== undefined && baseline > 0
                    ? current / baseline
                    : null,
            ratioToLimit: null,
            exceededLimit: false,
            failed: false,
        };
    }

    const exceededLimit = current > limit;

    return {
        ...comparison,
        ratioToBaseline: baseline !== undefined && baseline > 0 ? current / baseline : null,
        ratioToLimit: limit > 0 ? current / limit : null,
        exceededLimit,
        failed: exceededLimit,
    };
};

export const compareScenario = (
    scenario: string,
    current: PerfMetrics,
    baseline: Partial<PerfMetrics> | undefined,
    limits: ScenarioLimits | undefined,
    definitions: readonly MetricDefinition[] = METRIC_DEFINITIONS,
): ScenarioComparison => {
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
        failed: metrics.some(metric => metric.failed),
        unlimited: metrics.every(metric => metric.limit === null),
    };
};

export const getScenarioBaseline = (
    baselines: Baselines,
    scenario: string,
): Partial<PerfMetrics> | undefined => baselines[scenario];

export const getScenarioLimits = (limits: Limits, scenario: string): ScenarioLimits | undefined =>
    limits[scenario];
