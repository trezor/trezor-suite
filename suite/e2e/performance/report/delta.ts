import { median } from '@trezor/perf-e2e';

import { Baseline } from './baseline';
import { PerfSample } from './collect';
import {
    REPORT_METRICS,
    ReportMetric,
    SampleIdentity,
    measurementId,
    parseSyntheticUrl,
    syntheticUrl,
} from './identity';
import { SYNTHETIC_AUDITS } from './syntheticAudits';

/**
 * The comparison itself: medians on both sides, one verdict per metric. Everything here is pure —
 * the modules around it own the I/O.
 */

export type Verdict = 'regression' | 'improvement';

export type MetricDelta = {
    metric: ReportMetric;
    baseline: number | null;
    current: number | null;
    /** null: within noise, or one side missing — nothing to shout about either way. */
    verdict: Verdict | null;
};

export type ScenarioDelta = {
    identity: SampleIdentity;
    url: string;
    /** Sample count on the current side — a median of 1 is the honest common case. */
    runs: number;
    metrics: MetricDelta[];
};

const perfKeyByAuditId = new Map(SYNTHETIC_AUDITS.map(spec => [spec.id, spec.perfKey]));

/**
 * A sample's value for a metric, from its LHR when the timespan survived, or straight from the
 * in-page metrics when it did not — the `trezor-*` audits are those same numbers anyway.
 */
export const sampleAuditValue = (sample: PerfSample, auditId: string): number | null => {
    const fromLhr = sample.lhr?.audits?.[auditId]?.numericValue;
    if (typeof fromLhr === 'number') {
        return fromLhr;
    }

    const perfKey = perfKeyByAuditId.get(auditId);
    const fromMetrics = perfKey ? sample.perfMetrics?.[perfKey] : null;

    return typeof fromMetrics === 'number' ? fromMetrics : null;
};

/**
 * Both floors must trip, and lower is better everywhere: the relative floor keeps small drift on
 * big numbers quiet, the absolute floor keeps big percentages on tiny numbers quiet. One noisy
 * runner should produce a boring report, not a red one. A zero baseline (a scenario with no long
 * tasks yet, say) has no meaningful percentage, so there the absolute floor judges alone — any
 * change from zero past it is infinitely many percent, not zero.
 */
const verdictFor = (
    metric: ReportMetric,
    baseline: number | null,
    current: number | null,
): Verdict | null => {
    if (baseline === null || current === null) {
        return null;
    }

    const delta = current - baseline;
    if (Math.abs(delta) < metric.absoluteFloor) {
        return null;
    }
    if (
        metric.relativeFloor !== null &&
        baseline > 0 &&
        Math.abs(delta) / baseline < metric.relativeFloor
    ) {
        return null;
    }

    return delta > 0 ? 'regression' : 'improvement';
};

export const computeDeltas = (
    samples: PerfSample[],
    baseline: Baseline | null,
): ScenarioDelta[] => {
    const byMeasurement = new Map<string, { identity: SampleIdentity; samples: PerfSample[] }>();
    for (const sample of samples) {
        const identity = {
            target: sample.target,
            model: sample.model,
            scenario: sample.scenario,
        };
        const key = measurementId(identity);
        const group = byMeasurement.get(key) ?? { identity, samples: [] };
        group.samples.push(sample);
        byMeasurement.set(key, group);
    }

    return Array.from(byMeasurement.values())
        .map(({ identity, samples: group }) => {
            const url = syntheticUrl(identity);
            const baselineByAudit = baseline?.medians.get(url) ?? null;

            const metrics = REPORT_METRICS.map(metric => {
                const values = group
                    .map(sample => sampleAuditValue(sample, metric.auditId))
                    .filter((value): value is number => value !== null);
                const current = values.length > 0 ? median(values) : null;
                const base = baselineByAudit?.get(metric.auditId) ?? null;

                return {
                    metric,
                    baseline: base,
                    current,
                    verdict: verdictFor(metric, base, current),
                };
            }).filter(row => row.current !== null || row.baseline !== null);

            return { identity, url, runs: group.length, metrics };
        })
        .filter(delta => delta.metrics.length > 0)
        .sort((a, b) => measurementId(a.identity).localeCompare(measurementId(b.identity)));
};

/**
 * What the baseline covers but this run did not measure — a red shard, or a narrowed test set.
 * Scoped to (target, model) pairs this run measured at all: the nightly baseline also carries
 * models PRs deliberately never run (T3T1 accrues nightly only), and flagging those on every PR
 * would bury a real shard failure in permanent noise.
 */
export const missingScenarios = (
    samples: PerfSample[],
    baseline: Baseline | null,
): SampleIdentity[] => {
    if (!baseline) {
        return [];
    }

    const measured = new Set(
        samples.map(sample =>
            measurementId({
                target: sample.target,
                model: sample.model,
                scenario: sample.scenario,
            }),
        ),
    );
    const measuredPairs = new Set(samples.map(sample => `${sample.target}/${sample.model}`));

    return Array.from(baseline.medians.keys())
        .map(parseSyntheticUrl)
        .filter((identity): identity is SampleIdentity => identity !== null)
        .filter(identity => measuredPairs.has(`${identity.target}/${identity.model}`))
        .filter(identity => !measured.has(measurementId(identity)))
        .sort((a, b) => measurementId(a).localeCompare(measurementId(b)));
};
