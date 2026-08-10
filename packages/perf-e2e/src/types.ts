// Keep the keys stable: they are persisted in baselines.json and limits.json.
export type PerfMetricKey =
    | 'totalBlockingTimeMs'
    | 'longTaskCount'
    | 'longestTaskMs'
    | 'reactCommitCount'
    | 'interactionDurationMs';

// `null` means the metric could not be measured in this environment. Such a metric is reported,
// never enforced.
export type PerfMetrics = Record<PerfMetricKey, number | null>;

export type MetricUnit = 'ms' | 'count';

export type MetricDefinition = {
    key: PerfMetricKey;
    label: string;
    unit: MetricUnit;
};

/** What each scenario costs today, keyed by scenario name. Reported for reference, never enforced. */
export type Baselines = Record<string, Partial<PerfMetrics>>;

/**
 * The highest value each metric may reach before the run fails, keyed by metric. A metric without a
 * limit is reported but never enforced.
 */
export type ScenarioLimits = Partial<Record<PerfMetricKey, number>>;

/** Limits keyed by scenario name. */
export type Limits = Record<string, ScenarioLimits>;

export type MetricComparison = {
    key: PerfMetricKey;
    label: string;
    unit: MetricUnit;
    /** Reference only, never enforced. */
    baseline: number | null;
    current: number | null;
    /** null when the scenario sets none, which means this metric cannot fail. */
    limit: number | null;
    ratioToBaseline: number | null;
    ratioToLimit: number | null;
    exceededLimit: boolean;
    failed: boolean;
};

export type ScenarioComparison = {
    scenario: string;
    metrics: MetricComparison[];
    failed: boolean;
    /** No metric of this scenario has a limit, so nothing about it can fail. */
    unlimited: boolean;
};
