import { PERFORMANCE_LOG_PREFIX } from '@suite-native/performance-metrics';
import type { PerformanceSample, PerformanceScreen } from '@suite-native/performance-metrics';

/** Shaped like a real Android logcat entry: timestamp, pids, level and tag before the message. */
export const toLogcatLine = (message: string): string =>
    `09-17 10:11:12.345  4242  4267 I ReactNativeJS: ${message}`;

export const toSampleLine = (sample: PerformanceSample): string =>
    toLogcatLine(`${PERFORMANCE_LOG_PREFIX} ${JSON.stringify(sample)}`);

export const createSample = (
    screen: PerformanceScreen,
    overrides: Partial<PerformanceSample> = {},
): PerformanceSample => ({
    screen,
    ttffMs: 120,
    ttiMs: 400,
    fidMs: 20,
    score: 90,
    timestamp: 1750000000000,
    ...overrides,
});
