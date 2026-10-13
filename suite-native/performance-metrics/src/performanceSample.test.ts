import { createPerformanceSample } from './performanceSample';

const TIMESTAMP = 1750000000000;

describe('createPerformanceSample', () => {
    it('maps every library metric onto the sample', () => {
        expect(
            createPerformanceSample({
                screen: 'home',
                metrics: {
                    timeToFirstFrameMs: 123.4,
                    timeToInteractiveMs: 456.7,
                    firstInputDelay: { firstInputDelayMs: 12.3 },
                },
                score: { overall: 87 },
                timestamp: TIMESTAMP,
            }),
        ).toStrictEqual({
            screen: 'home',
            ttffMs: 123.4,
            ttiMs: 456.7,
            fidMs: 12.3,
            score: 87,
            timestamp: TIMESTAMP,
        });
    });

    it('reports a metric the library could not produce as null instead of omitting it', () => {
        expect(
            createPerformanceSample({
                screen: 'send',
                metrics: { timeToFirstFrameMs: 42 },
                score: null,
                timestamp: TIMESTAMP,
            }),
        ).toStrictEqual({
            screen: 'send',
            ttffMs: 42,
            ttiMs: null,
            fidMs: null,
            score: null,
            timestamp: TIMESTAMP,
        });
    });

    it('keeps a genuine zero measurement instead of nulling it', () => {
        const sample = createPerformanceSample({
            screen: 'accounts',
            metrics: {
                timeToFirstFrameMs: 0,
                timeToInteractiveMs: 0,
                firstInputDelay: { firstInputDelayMs: 0 },
            },
            score: { overall: 0 },
            timestamp: TIMESTAMP,
        });

        expect(sample).toMatchObject({ ttffMs: 0, ttiMs: 0, fidMs: 0, score: 0 });
    });

    it('nulls a non-finite measurement', () => {
        const sample = createPerformanceSample({
            screen: 'receive',
            metrics: {
                timeToFirstFrameMs: Number.NaN,
                timeToInteractiveMs: Number.POSITIVE_INFINITY,
            },
            score: null,
            timestamp: TIMESTAMP,
        });

        expect(sample).toMatchObject({ ttffMs: null, ttiMs: null });
    });

    it('stamps the sample with the current time when no timestamp is given', () => {
        jest.spyOn(Date, 'now').mockReturnValue(TIMESTAMP);

        expect(
            createPerformanceSample({
                screen: 'account-detail',
                metrics: { timeToFirstFrameMs: 1 },
                score: null,
            }).timestamp,
        ).toBe(TIMESTAMP);

        jest.restoreAllMocks();
    });
});
