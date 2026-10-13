import type { PerformanceSample, PerformanceScreen } from '@suite-native/performance-metrics';

import { PERFORMANCE_METRIC_KEYS, toMetricValues } from './metrics';
import type { PerformanceMetricValues } from './types';

/** One decimal is enough to tell two render times apart and keeps the report readable. */
export const roundMetric = (value: number): number => Math.round(value * 10) / 10;

/**
 * Median rather than mean: performance samples are skewed by occasional outliers (GC pauses, a
 * cold emulator, background CI load).
 */
export const median = (values: readonly number[]): number | null => {
    if (values.length === 0) {
        return null;
    }

    const sorted = values.toSorted((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 1) {
        return sorted[middle] ?? null;
    }

    const lower = sorted[middle - 1];
    const upper = sorted[middle];

    return lower !== undefined && upper !== undefined ? (lower + upper) / 2 : null;
};

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
        const medianValue = median(measured);

        aggregated[key] = medianValue === null ? null : roundMetric(medianValue);
    }

    return aggregated;
};
