import { compareScenario } from './compare';
import { buildJsonReport, formatHumanReport, formatMetricValue } from './report';
import { type PerfMetrics } from './types';

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 0,
    longTaskCount: 0,
    longestTaskMs: 0,
    reactCommitCount: 0,
    interactionDurationMs: 0,
    ...overrides,
});

describe(formatMetricValue.name, () => {
    it('writes a duration with its unit', () => {
        expect(formatMetricValue(453.26, 'ms')).toBe('453.3 ms');
    });

    // `18 count` would read as neither English nor a measurement.
    it('writes a count as the bare number', () => {
        expect(formatMetricValue(18, 'count')).toBe('18');
    });

    it('writes an unmeasurable metric as n/a rather than as a zero', () => {
        expect(formatMetricValue(null, 'ms')).toBe('n/a');
    });
});

describe('formatHumanReport', () => {
    it('renders a report listing only the metrics that went over their limit', () => {
        const comparison = compareScenario(
            'product-filter',
            metrics({
                totalBlockingTimeMs: 640,
                reactCommitCount: 147,
                interactionDurationMs: 900,
            }),
            undefined,
            { totalBlockingTimeMs: 500, reactCommitCount: 100, interactionDurationMs: 5000 },
        );

        const report = formatHumanReport(comparison);

        expect(report).toContain('Performance OVER LIMIT');
        expect(report).toContain('does not fail the run');
        expect(report).toContain('product-filter');
        expect(report).toContain('Total Blocking Time');
        expect(report).toContain('React commits');
        // A metric inside its limit is not part of the failure report.
        expect(report).not.toContain('Interaction duration');
    });

    it('shows the baseline of an over-limit metric as not enforced', () => {
        const comparison = compareScenario(
            'product-filter',
            metrics({ totalBlockingTimeMs: 640 }),
            { totalBlockingTimeMs: 600 },
            { totalBlockingTimeMs: 500 },
        );

        expect(formatHumanReport(comparison)).toContain('not enforced');
    });

    it('summarises a run that stayed within its limits', () => {
        const comparison = compareScenario(
            'product-filter',
            metrics({ totalBlockingTimeMs: 100 }),
            { totalBlockingTimeMs: 120 },
            { totalBlockingTimeMs: 500 },
        );

        expect(formatHumanReport(comparison)).toContain('Performance within limits');
    });

    // Otherwise a scenario nobody set a budget for would read as if it had passed one.
    it('says so when the scenario has no limits at all', () => {
        const comparison = compareScenario(
            'product-filter',
            metrics({ totalBlockingTimeMs: 100 }),
            undefined,
            undefined,
        );

        expect(formatHumanReport(comparison)).toContain('no limits set for this scenario');
    });
});

describe('buildJsonReport', () => {
    it('captures the metrics, their limits and the baseline they are read against', () => {
        const comparison = compareScenario(
            'product-filter',
            metrics({ totalBlockingTimeMs: 640 }),
            { totalBlockingTimeMs: 120 },
            { totalBlockingTimeMs: 500 },
        );

        const report = buildJsonReport(comparison);

        expect(report.scenario).toBe('product-filter');
        expect(report.overLimit).toBe(true);
        const blockingTime = report.metrics.find(m => m.key === 'totalBlockingTimeMs');
        expect(blockingTime).toMatchObject({
            baseline: 120,
            current: 640,
            limit: 500,
            exceededLimit: true,
        });
        expect(blockingTime?.ratioToLimit).toBeCloseTo(640 / 500);
    });
});
