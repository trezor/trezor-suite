import { createSample } from './fixtures';
import { buildPerformanceReport, formatMetricValue, formatPerformanceReport } from './report';
import type { PerformanceReportMeta } from './types';

const meta: Omit<PerformanceReportMeta, 'sampleCount'> = {
    platform: 'android',
    device: 'Pixel_6_API_34',
    appVersion: '26.10.1',
    commitHash: 'abcdef1234567890',
    generatedAt: '2026-09-17T10:11:12.345Z',
};

describe('formatMetricValue', () => {
    it('writes a duration with its unit and a score without one', () => {
        expect(formatMetricValue(123.44, 'ms')).toBe('123.4 ms');
        expect(formatMetricValue(87, 'score')).toBe('87');
    });

    it('distinguishes an unmeasured metric from a zero', () => {
        expect(formatMetricValue(null, 'ms')).toBe('n/a');
        expect(formatMetricValue(0, 'ms')).toBe('0 ms');
    });
});

describe('buildPerformanceReport', () => {
    it('builds one row per screen, sorted by screen name', () => {
        const report = buildPerformanceReport(
            [createSample('send'), createSample('accounts'), createSample('home')],
            meta,
        );

        expect(report.screens.map(screen => screen.scenario)).toEqual(['accounts', 'home', 'send']);
    });

    it('reduces repeated visits of one screen to a median and counts them', () => {
        const report = buildPerformanceReport(
            [
                createSample('home', { ttffMs: 100, timestamp: 1 }),
                createSample('home', { ttffMs: 500, timestamp: 2 }),
                createSample('home', { ttffMs: 300, timestamp: 3 }),
            ],
            meta,
        );

        expect(report.screens[0]?.sampleCount).toBe(3);
        expect(report.screens[0]?.metrics[0]).toMatchObject({
            key: 'ttffMs',
            current: 300,
            limit: 800,
            exceededLimit: false,
        });
        expect(report.meta.sampleCount).toBe(3);
    });

    it('reports a screen over the library default limit without any failure', () => {
        const report = buildPerformanceReport([createSample('home', { ttiMs: 4000 })], meta);

        expect(report.screens[0]?.overLimit).toBe(true);
        expect(report.aggregate.overLimit).toBe(true);
    });

    it('scores the run by the median of the per-screen scores', () => {
        const report = buildPerformanceReport(
            [
                createSample('home', { score: 60 }),
                createSample('accounts', { score: 80, timestamp: 2 }),
                createSample('send', { score: 100, timestamp: 3 }),
                createSample('send', { score: 100, timestamp: 4 }),
            ],
            meta,
        );

        expect(report.aggregate.score).toBe(80);
    });

    it('has no score when nothing could be scored', () => {
        const report = buildPerformanceReport([createSample('home', { score: null })], meta);

        expect(report.aggregate.score).toBeNull();
    });

    it('carries the run metadata through', () => {
        expect(buildPerformanceReport([createSample('home')], meta).meta).toEqual({
            ...meta,
            sampleCount: 1,
        });
    });

    it('produces an empty report for no samples', () => {
        const report = buildPerformanceReport([], meta);

        expect(report.screens).toEqual([]);
        expect(report.aggregate).toEqual({ score: null, overLimit: false });
    });
});

describe('formatPerformanceReport', () => {
    it('prints the metadata, a row per metric and a within-limits verdict', () => {
        const table = formatPerformanceReport(buildPerformanceReport([createSample('home')], meta));

        expect(table).toContain('NATIVE PERFORMANCE REPORT');
        expect(table).toContain('platform: android   device: Pixel_6_API_34   app: 26.10.1');
        expect(table).toContain('Screen: home  (median of 1 sample)');
        expect(table).toContain('Time to first frame');
        expect(table).toContain('Result: within limits.');
    });

    it('names the over-limit screens and says the run is not failed', () => {
        const table = formatPerformanceReport(
            buildPerformanceReport([createSample('send', { ttffMs: 5000 })], meta),
        );

        expect(table).toContain('Result: OVER LIMIT — send');
        expect(table).toContain('the run is not failed');
    });

    it('says so when no screen reported anything', () => {
        expect(formatPerformanceReport(buildPerformanceReport([], meta))).toContain(
            'No instrumented screen reported a measurement in this run.',
        );
    });
});
