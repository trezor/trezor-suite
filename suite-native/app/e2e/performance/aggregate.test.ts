import { aggregateSamples, groupSamplesByScreen, median, roundMetric } from './aggregate';
import { createSample } from './fixtures';

describe('median', () => {
    it('returns the middle value of an odd number of samples', () => {
        expect(median([300, 100, 200])).toBe(200);
    });

    it('averages the two middle values of an even number of samples', () => {
        expect(median([400, 100, 300, 200])).toBe(250);
    });

    it('returns null for no samples', () => {
        expect(median([])).toBeNull();
    });
});

describe('roundMetric', () => {
    it('keeps one decimal', () => {
        expect(roundMetric(123.44)).toBe(123.4);
        expect(roundMetric(123.46)).toBe(123.5);
    });
});

describe('groupSamplesByScreen', () => {
    it('groups by screen and keeps the order the samples arrived in', () => {
        const first = createSample('home');
        const second = createSample('accounts');
        const third = createSample('home', { timestamp: 1750000002000 });

        expect([...groupSamplesByScreen([first, second, third]).entries()]).toEqual([
            ['home', [first, third]],
            ['accounts', [second]],
        ]);
    });
});

describe('aggregateSamples', () => {
    it('reduces samples to a median per metric', () => {
        const samples = [
            createSample('home', { ttffMs: 100, ttiMs: 500, fidMs: 10, score: 90 }),
            createSample('home', { ttffMs: 300, ttiMs: 400, fidMs: 30, score: 70 }),
            createSample('home', { ttffMs: 200, ttiMs: 900, fidMs: 20, score: 80 }),
        ];

        expect(aggregateSamples(samples)).toEqual({
            ttffMs: 200,
            ttiMs: 500,
            fidMs: 20,
            lighthouseScore: 80,
        });
    });

    it('ignores the samples that could not measure a metric', () => {
        const samples = [
            createSample('send', { fidMs: null }),
            createSample('send', { fidMs: 40 }),
            createSample('send', { fidMs: 60 }),
        ];

        expect(aggregateSamples(samples).fidMs).toBe(50);
    });

    it('keeps a metric null when no sample measured it', () => {
        const samples = [
            createSample('send', { fidMs: null }),
            createSample('send', { fidMs: null }),
        ];

        expect(aggregateSamples(samples).fidMs).toBeNull();
    });

    it('rounds the median to one decimal', () => {
        const samples = [
            createSample('home', { ttffMs: 100.11 }),
            createSample('home', { ttffMs: 100.18 }),
        ];

        expect(aggregateSamples(samples).ttffMs).toBe(100.1);
    });
});
