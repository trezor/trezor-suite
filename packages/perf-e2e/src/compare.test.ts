import { compareMetric, compareScenario } from './compare';
import { type MetricDefinition, type PerfMetrics } from './types';

const blockingTime: MetricDefinition = {
    key: 'totalBlockingTimeMs',
    label: 'Total Blocking Time',
    unit: 'ms',
};

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 100,
    longTaskCount: 1,
    longestTaskMs: 60,
    reactCommitCount: 20,
    interactionDurationMs: 500,
    ...overrides,
});

describe(compareMetric.name, () => {
    it('passes a metric that stays within its limit', () => {
        const comparison = compareMetric(blockingTime, undefined, 1000, 999);

        expect(comparison).toMatchObject({ exceededLimit: false, limit: 1000 });
    });

    it('passes a metric that reaches its limit exactly', () => {
        const comparison = compareMetric(blockingTime, undefined, 1000, 1000);

        expect(comparison.exceededLimit).toBe(false);
    });

    it('fails a metric that goes over its limit', () => {
        const comparison = compareMetric(blockingTime, undefined, 1000, 1001);

        expect(comparison.exceededLimit).toBe(true);
    });

    // The whole point of the limits: what the app used to cost has no say in what it may cost.
    it('reports a metric over its limit even when it is at the baseline', () => {
        const comparison = compareMetric(blockingTime, 1500, 1000, 1500);

        expect(comparison.exceededLimit).toBe(true);
    });

    it('passes a metric within its limit however far above the baseline it is', () => {
        const comparison = compareMetric(blockingTime, 100, 1000, 900);

        expect(comparison.exceededLimit).toBe(false);
    });

    it('reports the share of the limit that was used', () => {
        const comparison = compareMetric(blockingTime, undefined, 1000, 250);

        expect(comparison.ratioToLimit).toBe(0.25);
    });

    it('never reports a metric the scenario sets no limit for', () => {
        const comparison = compareMetric(blockingTime, 100, undefined, 100_000);

        expect(comparison).toMatchObject({ limit: null, ratioToLimit: null, exceededLimit: false });
    });

    it('never reports a metric that could not be measured', () => {
        const comparison = compareMetric(blockingTime, 100, 1000, null);

        expect(comparison).toMatchObject({
            current: null,
            ratioToLimit: null,
            exceededLimit: false,
        });
    });

    it('keeps the baseline for the report even though it does not gate', () => {
        const comparison = compareMetric(blockingTime, 400, 1000, 800);

        expect(comparison.baseline).toBe(400);
    });
});

describe(compareScenario.name, () => {
    const limits = { totalBlockingTimeMs: 1000, reactCommitCount: 300 };

    it('reports the scenario over limit when any metric goes over its limit', () => {
        const comparison = compareScenario(
            'wallet-discovery',
            metrics({ reactCommitCount: 301 }),
            undefined,
            limits,
        );

        expect(comparison.overLimit).toBe(true);
        expect(
            comparison.metrics.filter(metric => metric.exceededLimit).map(metric => metric.key),
        ).toEqual(['reactCommitCount']);
    });

    it('does not report a scenario whose measured metrics all stay under their limits', () => {
        const comparison = compareScenario('wallet-discovery', metrics(), undefined, limits);

        // `unlimited` tells this apart from a scenario that was never measured against anything,
        // which would report the very same `overLimit`.
        expect(comparison).toMatchObject({ overLimit: false, unlimited: false });
    });

    it('marks a scenario nothing is limited for, so that it cannot look measured against', () => {
        const comparison = compareScenario('wallet-discovery', metrics(), undefined, undefined);

        expect(comparison).toMatchObject({ overLimit: false, unlimited: true });
    });

    it('treats a null limit the same as an absent one', () => {
        const comparison = compareScenario('wallet-discovery', metrics(), undefined, {
            totalBlockingTimeMs: undefined,
        });

        expect(comparison.metrics[0]).toMatchObject({ limit: null, exceededLimit: false });
    });

    it('carries the recorded baseline into the comparison', () => {
        const comparison = compareScenario(
            'wallet-discovery',
            metrics(),
            { totalBlockingTimeMs: 50 },
            limits,
        );

        expect(comparison.metrics[0]?.baseline).toBe(50);
    });
});
