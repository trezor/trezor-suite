import type { PerformanceScreen } from '@suite-native/performance-metrics';

/**
 * Keep the keys stable: they are persisted in the baselines and limits of `budgets.ts` and read by
 * the same tooling as the desktop report, whose own keys live in `@trezor/perf-e2e`.
 */
export type PerformanceMetricKey = 'ttffMs' | 'ttiMs' | 'fidMs' | 'lighthouseScore';

/** A score is a 0-100 grade, not a duration, so it is printed as a bare number. */
export type PerformanceMetricUnit = 'ms' | 'score';

export type PerformanceMetricDefinition = {
    key: PerformanceMetricKey;
    label: string;
    unit: PerformanceMetricUnit;
};

/** `null` means the metric could not be measured on this run, which is not the same as a zero. */
export type PerformanceMetricValues = Record<PerformanceMetricKey, number | null>;

/**
 * The Lighthouse score is better when it is higher, so it cannot be held against a ceiling the way
 * a duration can. It is reported for reference and the three timings it is computed from carry the
 * limits.
 */
export type TimingMetricKey = Exclude<PerformanceMetricKey, 'lighthouseScore'>;

export type ScreenLimits = Partial<Record<TimingMetricKey, number>>;

/** What each screen costs today. Reported for reference, never enforced. */
export type Baselines = Partial<Record<PerformanceScreen, Partial<PerformanceMetricValues>>>;

/** Limits keyed by screen. A screen without an entry cannot be reported as over limit. */
export type Limits = Partial<Record<PerformanceScreen, ScreenLimits>>;

export type PerformanceMetricRow = {
    key: PerformanceMetricKey;
    label: string;
    unit: PerformanceMetricUnit;
    /** Reference only, never enforced. */
    baseline: number | null;
    current: number | null;
    /** null when the screen sets none, which means this metric cannot be reported as over. */
    limit: number | null;
    ratioToLimit: number | null;
    exceededLimit: boolean;
};

export type PerformanceScreenReport = {
    scenario: string;
    /**
     * A metric went over its limit. Reported loudly, but never turned into a test failure: a
     * performance number is not a reason to block a merge on its own.
     */
    overLimit: boolean;
    /** No metric of this screen has a limit, so there is nothing to report against. */
    unlimited: boolean;
    sampleCount: number;
    metrics: PerformanceMetricRow[];
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
