import { type Limits, type ScenarioComparison, type ScenarioLimits } from './types';

/**
 * Headroom over the measured value. CI runners are noisy, so a limit set exactly at what a run
 * happened to cost would fail on the next slightly slower runner.
 */
export const SUGGESTED_LIMIT_HEADROOM = 1.5;

/**
 * Round up to two significant figures, so a pasted limit reads as a decision rather than as a
 * measurement — 4.5 → 5, 94.5 → 95, 1944 → 2000 — while staying close to the value it came from.
 * Rounding to one figure would add up to another 50% on top of the headroom.
 */
const roundUpToNiceNumber = (value: number): number => {
    if (value <= 0) {
        return 0;
    }
    const step = value <= 10 ? 1 : 10 ** (Math.floor(Math.log10(value)) - 1);

    return Math.ceil(value / step) * step;
};

/**
 * The limits this run would need, for the metrics that have one. Printed so raising a limit is a
 * paste rather than arithmetic — and still an edit to a committed number, reviewed as the decision it
 * is.
 */
export const suggestLimits = (comparisons: readonly ScenarioComparison[]): Limits =>
    comparisons.reduce<Limits>((limits, comparison) => {
        const scenarioLimits = comparison.metrics.reduce<ScenarioLimits>((metrics, metric) => {
            if (metric.limit === null || metric.current === null) {
                return metrics;
            }

            // Only a metric that went over gets a new number. Fitting a limit around a run that was
            // already inside it would inflate every budget on every paste.
            return {
                ...metrics,
                [metric.key]: metric.exceededLimit
                    ? Math.max(
                          metric.limit,
                          roundUpToNiceNumber(metric.current * SUGGESTED_LIMIT_HEADROOM),
                      )
                    : metric.limit,
            };
        }, {});

        return Object.keys(scenarioLimits).length > 0
            ? { ...limits, [comparison.scenario]: scenarioLimits }
            : limits;
    }, {});
