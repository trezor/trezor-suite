import { type PerformanceSample, type PerformanceScreen } from './types';

// Structural subsets of the react-native-lighthouse result types. Declaring them here keeps this
// module free of the library so that it stays out of non-Detox bundles.
type ScreenMetrics = {
    timeToFirstFrameMs?: number;
    timeToInteractiveMs?: number;
    firstInputDelay?: { firstInputDelayMs: number };
};

type ScreenScore = {
    overall: number;
};

type CreatePerformanceSampleParams = {
    screen: PerformanceScreen;
    metrics: ScreenMetrics;
    score: ScreenScore | null;
    timestamp?: number;
};

const toMetricValue = (value: number | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

export const createPerformanceSample = ({
    screen,
    metrics,
    score,
    timestamp = Date.now(),
}: CreatePerformanceSampleParams): PerformanceSample => ({
    screen,
    ttffMs: toMetricValue(metrics.timeToFirstFrameMs),
    ttiMs: toMetricValue(metrics.timeToInteractiveMs),
    fidMs: toMetricValue(metrics.firstInputDelay?.firstInputDelayMs),
    score: toMetricValue(score?.overall),
    timestamp,
});
