import { METRIC_KEYS } from './config';
import { type PerfMetrics } from './types';

/**
 * Median rather than mean: performance samples are skewed by occasional outliers (GC pauses,
 * background CI load).
 */
export const median = (values: readonly number[]): number => {
    if (values.length === 0) {
        throw new Error('Cannot compute median of an empty sample set');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        const lower = sorted[mid - 1];
        const upper = sorted[mid];

        // Guarded for noUncheckedIndexedAccess; both are defined for a non-empty even-length array.
        return lower !== undefined && upper !== undefined ? (lower + upper) / 2 : 0;
    }

    return sorted[mid] ?? 0;
};

/**
 * Reduce N samples of a scenario into a single set of per-metric medians, so that a retried test is
 * judged on its median rather than on its worst attempt.
 */
export const aggregateSamples = (samples: readonly PerfMetrics[]): PerfMetrics => {
    if (samples.length === 0) {
        throw new Error('Cannot aggregate an empty set of samples');
    }

    const aggregated = {} as PerfMetrics;
    for (const key of METRIC_KEYS) {
        // Drop unavailable (null) samples; a metric is null only if it was unavailable in every run.
        const values = samples
            .map(sample => sample[key])
            .filter((value): value is number => value !== null);
        aggregated[key] = values.length > 0 ? Math.round(median(values)) : null;
    }

    return aggregated;
};
