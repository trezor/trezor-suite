import type { PerformanceSample, PerformanceScreen } from '@suite-native/performance-metrics';
import { median } from '@trezor/perf-e2e';
import { roundTo } from '@trezor/utils';

import { PERFORMANCE_METRIC_KEYS, toMetricValues } from './metrics';
import type { PerformanceMetricValues } from './types';

/** One decimal is enough to tell two render times apart and keeps the report readable. */
export const METRIC_PRECISION = 1;

export const groupSamplesByScreen = (
    samples: readonly PerformanceSample[],
): Map<PerformanceScreen, PerformanceSample[]> => {
    const grouped = new Map<PerformanceScreen, PerformanceSample[]>();

    for (const sample of samples) {
        grouped.set(sample.screen, [...(grouped.get(sample.screen) ?? []), sample]);
    }

    return grouped;
};

/**
 * Reduce N samples of one screen into a single set of per-metric medians, so that a screen visited
 * repeatedly is judged on its median rather than on its worst visit.
 */
export const aggregateSamples = (
    samples: readonly PerformanceSample[],
): PerformanceMetricValues => {
    const values = samples.map(toMetricValues);
    const aggregated = {} as PerformanceMetricValues;

    for (const key of PERFORMANCE_METRIC_KEYS) {
        // Drop unavailable (null) samples; a metric stays null only when no sample produced it.
        const measured = values
            .map(value => value[key])
            .filter((value): value is number => value !== null);
        aggregated[key] = measured.length > 0 ? roundTo(median(measured), METRIC_PRECISION) : null;
    }

    return aggregated;
};
