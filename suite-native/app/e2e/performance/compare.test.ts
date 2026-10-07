import { compareMetric, compareScreen } from './compare';
import type { PerformanceMetricDefinition, PerformanceMetricValues } from './types';

const ttffDefinition: PerformanceMetricDefinition = {
    key: 'ttffMs',
    label: 'Time to first frame',
    unit: 'ms',
};

const values: PerformanceMetricValues = {
    ttffMs: 120,
    ttiMs: 400,
    fidMs: 20,
    lighthouseScore: 90,
};

describe('compareMetric', () => {
    it('reports a metric within its limit', () => {
        expect(compareMetric(ttffDefinition, undefined, 800, 120)).toEqual({
            key: 'ttffMs',
            label: 'Time to first frame',
            unit: 'ms',
            baseline: null,
            current: 120,
            limit: 800,
            ratioToLimit: 0.15,
            exceededLimit: false,
        });
    });

    it('reports a metric over its limit', () => {
        const comparison = compareMetric(ttffDefinition, 700, 800, 900);

        expect(comparison.exceededLimit).toBe(true);
        expect(comparison.ratioToLimit).toBeCloseTo(1.125);
        expect(comparison.baseline).toBe(700);
    });

    it('cannot exceed a limit it does not have', () => {
        expect(compareMetric(ttffDefinition, undefined, undefined, 9000)).toMatchObject({
            limit: null,
            ratioToLimit: null,
            exceededLimit: false,
        });
    });

    it('does not judge a metric this run could not measure', () => {
        expect(compareMetric(ttffDefinition, undefined, 800, null)).toMatchObject({
            current: null,
            ratioToLimit: null,
            exceededLimit: false,
        });
    });
});

describe('compareScreen', () => {
    it('compares every registered metric and carries the sample count', () => {
        const screen = compareScreen({
            scenario: 'home',
            sampleCount: 3,
            current: values,
            baseline: { ttffMs: 100 },
            limits: { ttffMs: 800, ttiMs: 1500, fidMs: 150 },
        });

        expect(screen.metrics.map(metric => metric.key)).toEqual([
            'ttffMs',
            'ttiMs',
            'fidMs',
            'lighthouseScore',
        ]);
        expect(screen.sampleCount).toBe(3);
        expect(screen.overLimit).toBe(false);
        expect(screen.unlimited).toBe(false);
    });

    it('never holds the score against a limit, because a higher score is better', () => {
        const screen = compareScreen({
            scenario: 'home',
            sampleCount: 1,
            current: { ...values, lighthouseScore: 3 },
            baseline: undefined,
            limits: { ttffMs: 800 },
        });

        expect(screen.metrics.find(metric => metric.key === 'lighthouseScore')).toMatchObject({
            current: 3,
            limit: null,
            exceededLimit: false,
        });
        expect(screen.overLimit).toBe(false);
    });

    it('flags a screen whose metric went over', () => {
        const screen = compareScreen({
            scenario: 'send',
            sampleCount: 2,
            current: { ...values, ttiMs: 4000 },
            baseline: undefined,
            limits: { ttiMs: 1500 },
        });

        expect(screen.overLimit).toBe(true);
        expect(screen.unlimited).toBe(false);
    });

    it('is unlimited when the screen has no limits at all', () => {
        const screen = compareScreen({
            scenario: 'brand-new-screen',
            sampleCount: 1,
            current: values,
            baseline: undefined,
            limits: undefined,
        });

        expect(screen.unlimited).toBe(true);
        expect(screen.overLimit).toBe(false);
    });
});
