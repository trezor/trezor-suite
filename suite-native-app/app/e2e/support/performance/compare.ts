import { compareScenarioMetrics } from '@trezor/perf-e2e';

import { PERFORMANCE_METRIC_DEFINITIONS } from './metrics';
import type {
    PerformanceMetricDefinition,
    PerformanceMetricKey,
    PerformanceMetricUnit,
    PerformanceMetricValues,
    PerformanceScreenReport,
    ScreenLimits,
} from './types';

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
}): PerformanceScreenReport => ({
    // Explicit: inferred from `limits` alone, the key would narrow to the timings.
    ...compareScenarioMetrics<PerformanceMetricKey, PerformanceMetricUnit>({
        scenario,
        current,
        baseline,
        limits,
        definitions,
    }),
    sampleCount,
});
