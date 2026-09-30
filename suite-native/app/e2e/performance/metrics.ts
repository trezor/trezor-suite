import type { PerformanceSample } from '@suite-native/performance-metrics';

import type {
    PerformanceMetricDefinition,
    PerformanceMetricKey,
    PerformanceMetricValues,
} from './types';

/**
 * The metric registry. Order defines the order used in the report and in the terminal table.
 * Thresholds are per screen, in `budgets.ts`.
 */
export const PERFORMANCE_METRIC_DEFINITIONS: readonly PerformanceMetricDefinition[] = [
    { key: 'ttffMs', label: 'Time to first frame', unit: 'ms' },
    { key: 'ttiMs', label: 'Time to interactive', unit: 'ms' },
    { key: 'fidMs', label: 'First input delay', unit: 'ms' },
    { key: 'lighthouseScore', label: 'Lighthouse score', unit: 'score' },
];

export const PERFORMANCE_METRIC_KEYS: readonly PerformanceMetricKey[] =
    PERFORMANCE_METRIC_DEFINITIONS.map(definition => definition.key);

export const toMetricValues = (sample: PerformanceSample): PerformanceMetricValues => ({
    ttffMs: sample.ttffMs,
    ttiMs: sample.ttiMs,
    fidMs: sample.fidMs,
    lighthouseScore: sample.score,
});
