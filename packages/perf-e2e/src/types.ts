// Keep the keys stable: they are persisted in the baselines and limits of `budgets.ts`.
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
 * The highest value each metric may reach before the run reports it as over limit, keyed by metric.
 * Going over is reported, never failed; a metric without a limit is not even reported as over.
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
    ratioToLimit: number | null;
    exceededLimit: boolean;
};

export type ScenarioComparison = {
    scenario: string;
    metrics: MetricComparison[];
    /**
     * A metric went over its limit. Reported loudly, but never turned into a test failure: a
     * performance number is not a reason to block a merge on its own, and a red report that everyone
     * can see is worth more than a red build everyone learns to re-run.
     */
    overLimit: boolean;
    /** No metric of this scenario has a limit, so there is nothing to report against. */
    unlimited: boolean;
};
