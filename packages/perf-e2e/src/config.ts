import { type MetricDefinition, type PerfMetricKey } from './types';

/**
 * The metric registry. Order defines the order used in reports. Thresholds are per scenario, in
 * the app's `budgets.ts` — the same metric means very different things in an account switch and in
 * a multi-account discovery.
 */
export const METRIC_DEFINITIONS: readonly MetricDefinition[] = [
    {
        key: 'totalBlockingTimeMs',
        label: 'Total Blocking Time',
        unit: 'ms',
    },
    {
        key: 'longTaskCount',
        label: 'Long tasks (>50ms)',
        unit: 'count',
    },
    {
        key: 'longestTaskMs',
        label: 'Longest task',
        unit: 'ms',
    },
    {
        key: 'reactCommitCount',
        label: 'React commits',
        unit: 'count',
    },
    {
        key: 'interactionDurationMs',
        label: 'Interaction duration',
        unit: 'ms',
    },
];

export const METRIC_KEYS: readonly PerfMetricKey[] = METRIC_DEFINITIONS.map(def => def.key);
