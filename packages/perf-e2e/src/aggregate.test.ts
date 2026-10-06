import { aggregateSamples, median } from './aggregate';
import { type PerfMetrics } from './types';

const sample = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 0,
    longTaskCount: 0,
    longestTaskMs: 0,
    reactCommitCount: 0,
    interactionDurationMs: 0,
    ...overrides,
});

describe('median', () => {
    it('returns the middle value for odd-length input', () => {
        expect(median([90, 10, 50])).toBe(50);
    });

    it('averages the two middle values for even-length input', () => {
        expect(median([10, 20, 30, 40])).toBe(25);
    });

    it('is robust to a single outlier', () => {
        expect(median([100, 105, 110, 5000])).toBe(107.5);
    });

    it('throws on empty input', () => {
        expect(() => median([])).toThrow();
    });
});

describe('aggregateSamples', () => {
    it('computes per-metric medians rounded to integers', () => {
        const samples = [
            sample({ totalBlockingTimeMs: 100, reactCommitCount: 6 }),
            sample({ totalBlockingTimeMs: 120, reactCommitCount: 7 }),
            sample({ totalBlockingTimeMs: 900, reactCommitCount: 8 }),
        ];
        const result = aggregateSamples(samples);
        expect(result.totalBlockingTimeMs).toBe(120);
        expect(result.reactCommitCount).toBe(7);
    });

    it('throws on empty input', () => {
        expect(() => aggregateSamples([])).toThrow();
    });

    // A metric can read null where the environment cannot measure it, and a null must not be
    // averaged in as a zero — that would report an unmeasured metric as a fast one.
    it('yields null for a metric that is unavailable in every sample', () => {
        const samples = [sample({ longestTaskMs: null }), sample({ longestTaskMs: null })];
        expect(aggregateSamples(samples).longestTaskMs).toBeNull();
    });

    it('ignores null samples when some runs measured the metric', () => {
        const samples = [
            sample({ longestTaskMs: null }),
            sample({ longestTaskMs: 100 }),
            sample({ longestTaskMs: 200 }),
        ];
        expect(aggregateSamples(samples).longestTaskMs).toBe(150);
    });
});
