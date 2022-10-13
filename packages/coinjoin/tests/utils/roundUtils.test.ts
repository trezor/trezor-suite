import { readTimeSpan, estimatePhaseDeadline } from '../../src/utils/roundUtils';
import { DEFAULT_ROUND } from '../fixtures/round.fixture';

describe('roundUtils', () => {
    it('readTimeSpan', () => {
        expect(readTimeSpan('0d 0h 0m 1s')).toEqual(1000);
        expect(readTimeSpan('1d 0h 0m 0s')).toEqual(24 * 60 * 60000);
        expect(readTimeSpan('1d 2h 0m 0s')).toEqual(26 * 60 * 60000);
        expect(readTimeSpan('1d 2h 3m 30s')).toEqual(26 * 60 * 60000 + 3 * 60000 + 30000);
        expect(readTimeSpan('d h m s')).toEqual(0);
    });

    it('estimatePhaseDeadline', () => {
        const base = new Date(DEFAULT_ROUND.inputRegistrationEnd).getTime();
        expect(estimatePhaseDeadline(DEFAULT_ROUND)).toEqual(base);

        expect(
            estimatePhaseDeadline({
                ...DEFAULT_ROUND,
                phase: 1,
            }),
        ).toEqual(base + 60000);

        expect(
            estimatePhaseDeadline({
                ...DEFAULT_ROUND,
                phase: 2,
            }),
        ).toEqual(base + 60000 * 2);

        expect(
            estimatePhaseDeadline({
                ...DEFAULT_ROUND,
                phase: 3,
            }),
        ).toEqual(base + 60000 * 3);

        expect(
            estimatePhaseDeadline({
                ...DEFAULT_ROUND,
                phase: 4,
            }),
        ).toEqual(0);
    });
});
