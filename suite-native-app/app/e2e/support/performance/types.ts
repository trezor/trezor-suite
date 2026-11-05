import type { PerformanceScreen } from '@suite-native/performance-metrics';
import type { MetricComparison, MetricDefinition, ScenarioComparison } from '@trezor/perf-e2e';

/** Durations, each held against a ceiling in `budgets.ts`. */
type TimingMetricDefinition = MetricDefinition<'ttffMs' | 'ttiMs' | 'fidMs', 'ms'>;

/**
 * A 0-100 grade. It is better when higher, so it cannot be held against a ceiling the way a
 * duration can: it is reported for reference, and the timings it is computed from carry the limits.
 */
type ScoreMetricDefinition = MetricDefinition<'lighthouseScore', 'score'>;

export type PerformanceMetricDefinition = TimingMetricDefinition | ScoreMetricDefinition;

/**
 * Keep the keys stable: they are persisted in the baselines and limits of `budgets.ts` and read by
 * the same tooling as the desktop report, whose own keys live in `@trezor/perf-e2e`.
 */
export type PerformanceMetricKey = PerformanceMetricDefinition['key'];

export type PerformanceMetricUnit = PerformanceMetricDefinition['unit'];

export type TimingMetricKey = TimingMetricDefinition['key'];

/** `null` means the metric could not be measured on this run, which is not the same as a zero. */
export type PerformanceMetricValues = Record<PerformanceMetricKey, number | null>;

export type ScreenLimits = Partial<Record<TimingMetricKey, number>>;

/** What each screen costs today. Reported for reference, never enforced. */
export type Baselines = Partial<Record<PerformanceScreen, Partial<PerformanceMetricValues>>>;

/** Limits keyed by screen. A screen without an entry cannot be reported as over limit. */
export type Limits = Partial<Record<PerformanceScreen, ScreenLimits>>;

/** The same row and scenario shape as the desktop report, so one tool reads both. */
export type PerformanceMetricRow = MetricComparison<PerformanceMetricKey, PerformanceMetricUnit>;

export type PerformanceScreenReport = ScenarioComparison<
    PerformanceMetricKey,
    PerformanceMetricUnit
> & {
    sampleCount: number;
};

export type PerformancePlatform = 'android' | 'ios' | 'unknown';

export type PerformanceReportMeta = {
    platform: PerformancePlatform;
    device: string;
    appVersion: string;
    commitHash: string;
    generatedAt: string;
    sampleCount: number;
};

export type PerformanceReport = {
    meta: PerformanceReportMeta;
    screens: PerformanceScreenReport[];
    aggregate: {
        score: number | null;
        overLimit: boolean;
    };
};
