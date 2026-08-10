import { compareScenario } from './compare';
import { buildJsonReport, formatHumanReport } from './report';
import { type PerfMetrics } from './types';

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 0,
    longTaskCount: 0,
    longestTaskMs: 0,
    reactCommitCount: 0,
    interactionDurationMs: 0,
    ...overrides,
});

describe('formatHumanReport', () => {
    it('renders a failure report listing only the metrics that went over their limit', () => {
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

        expect(report).toContain('Performance LIMIT exceeded');
        expect(report).toContain('product-filter');
        expect(report).toContain('Total Blocking Time');
        expect(report).toContain('React commits');
        // A metric inside its limit is not part of the failure report.
        expect(report).not.toContain('Interaction duration');
    });

    it('shows the baseline of a failing metric as not enforced', () => {
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
        expect(report.failed).toBe(true);
        const blockingTime = report.metrics.find(m => m.key === 'totalBlockingTimeMs');
        expect(blockingTime).toMatchObject({
            baseline: 120,
            current: 640,
            limit: 500,
            exceededLimit: true,
        });
        expect(blockingTime?.ratioToLimit).toBeCloseTo(640 / 500);
        expect(blockingTime?.ratioToBaseline).toBeCloseTo(640 / 120);
    });
});
