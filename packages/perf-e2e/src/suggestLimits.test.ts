import { compareScenario } from './compare';
import { suggestLimits } from './suggestLimits';
import { type PerfMetrics } from './types';

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 0,
    longTaskCount: 0,
    longestTaskMs: 0,
    reactCommitCount: 0,
    interactionDurationMs: 0,
    ...overrides,
});

const comparison = (current: Partial<PerfMetrics>, limits: Partial<Record<string, number>>) =>
    compareScenario('wallet-discovery', metrics(current), undefined, limits);

describe(suggestLimits.name, () => {
    it('suggests a limit above the measured value, rounded to a number a human would pick', () => {
        const suggested = suggestLimits([
            comparison({ totalBlockingTimeMs: 1296 }, { totalBlockingTimeMs: 1000 }),
        ]);

        expect(suggested).toEqual({ 'wallet-discovery': { totalBlockingTimeMs: 2000 } });
    });

    // Otherwise a fast run would quietly ratchet the limit down, turning a lucky runner into the
    // budget everyone else has to meet.
    it('never suggests lowering a limit', () => {
        const suggested = suggestLimits([
            comparison({ totalBlockingTimeMs: 10 }, { totalBlockingTimeMs: 1000 }),
        ]);

        expect(suggested['wallet-discovery']?.totalBlockingTimeMs).toBe(1000);
    });

    // Otherwise every paste of the block would inflate budgets the run never came close to.
    it('leaves a limit the run stayed inside untouched', () => {
        const suggested = suggestLimits([
            comparison({ totalBlockingTimeMs: 900 }, { totalBlockingTimeMs: 1000 }),
        ]);

        expect(suggested['wallet-discovery']?.totalBlockingTimeMs).toBe(1000);
    });

    it('leaves out metrics that have no limit', () => {
        const suggested = suggestLimits([
            comparison(
                { totalBlockingTimeMs: 100, longTaskCount: 9 },
                { totalBlockingTimeMs: 500 },
            ),
        ]);

        expect(suggested['wallet-discovery']).toEqual({ totalBlockingTimeMs: 500 });
    });

    it('leaves out a scenario that has no limits at all', () => {
        expect(suggestLimits([comparison({ totalBlockingTimeMs: 100 }, {})])).toEqual({});
    });

    it('rounds a small count up to a usable step', () => {
        const suggested = suggestLimits([comparison({ longTaskCount: 3 }, { longTaskCount: 1 })]);

        expect(suggested['wallet-discovery']?.longTaskCount).toBe(5);
    });

    // The block the report prints replaces the scenario as a whole, so a metric left out of it
    // would delete that budget from `budgets.ts` on the next paste.
    it('keeps the limit of a metric this run could not measure', () => {
        const suggested = suggestLimits([
            comparison(
                { totalBlockingTimeMs: null, reactCommitCount: 10 },
                { totalBlockingTimeMs: 500, reactCommitCount: 100 },
            ),
        ]);

        expect(suggested['wallet-discovery']).toEqual({
            totalBlockingTimeMs: 500,
            reactCommitCount: 100,
        });
    });

    // One scenario is measured once per device model, so the pasted limit has to fit the slowest of
    // them rather than whichever was reported last.
    it('keeps the highest suggestion when a scenario was measured more than once', () => {
        const suggested = suggestLimits([
            comparison({ totalBlockingTimeMs: 1296 }, { totalBlockingTimeMs: 1000 }),
            comparison({ totalBlockingTimeMs: 100 }, { totalBlockingTimeMs: 1000 }),
        ]);

        expect(suggested['wallet-discovery']?.totalBlockingTimeMs).toBe(2000);
    });

    it('keeps the highest suggestion whichever order the models are reported in', () => {
        const suggested = suggestLimits([
            comparison({ totalBlockingTimeMs: 100 }, { totalBlockingTimeMs: 1000 }),
            comparison({ totalBlockingTimeMs: 1296 }, { totalBlockingTimeMs: 1000 }),
        ]);

        expect(suggested['wallet-discovery']?.totalBlockingTimeMs).toBe(2000);
    });
});
