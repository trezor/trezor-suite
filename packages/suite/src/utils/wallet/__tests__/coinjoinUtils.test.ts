import * as coinjoinUtils from '../coinjoinUtils';
import * as fixtures from '../__fixtures__/coinjoinUtils';

describe('breakdownCoinjoinBalance', () => {
    it('works without session', () => {
        const breakdown = coinjoinUtils.breakdownCoinjoinBalance(fixtures.breakdownParams);

        expect(breakdown).toEqual({
            notAnonymized: '200',
            anonymized: '100',
        });
    });
});

describe('calculateAnonymityProgress', () => {
    it('calculates correctly', () => {
        fixtures.calculateProgressParams.forEach(({ params, result }) => {
            const progress = coinjoinUtils.calculateAnonymityProgress(params);

            expect(progress).toEqual(result);
        });
    });
});

describe('getRoundPhaseFromSessionPhase', () => {
    it('gets correct value or throws', () => {
        fixtures.getRoundPhaseFromSessionPhase.forEach(({ sessionPhase, result }) => {
            const getSessionPhase = () => coinjoinUtils.getRoundPhaseFromSessionPhase(sessionPhase);

            if (result === 'error') {
                expect(getSessionPhase).toThrowError();
            } else {
                expect(getSessionPhase()).toEqual(result);
            }
        });
    });
});

describe('getFirstSessionPhaseFromRoundPhase', () => {
    it('gets correct value or throws', () => {
        fixtures.getFirstSessionPhaseFromRoundPhase.forEach(({ roundPhase, result }) => {
            const getSessionPhase = () =>
                coinjoinUtils.getFirstSessionPhaseFromRoundPhase(roundPhase);

            if (result === 'error') {
                expect(getSessionPhase).toThrowError();
            } else {
                expect(getSessionPhase()).toEqual(result);
            }
        });
    });
});

describe('cleanAnonymityGains', () => {
    it('cleans correctly', () => {
        fixtures.cleanAnonymityGains.forEach(({ params, resultLength }) => {
            const records = coinjoinUtils.cleanAnonymityGains(params);

            expect(records).toHaveLength(resultLength);
        });
    });
});

describe('calculateAverageAnonymityGainPerRound', () => {
    it('calculates correctly', () => {
        fixtures.averageAnonymityGainsParams.forEach(({ params, checkResult }) => {
            const average = coinjoinUtils.calculateAverageAnonymityGainPerRound(...params);

            expect(checkResult(average)).toBe(true);
        });
    });
});
