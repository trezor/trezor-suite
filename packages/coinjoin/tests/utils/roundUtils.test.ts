import { getCommitmentData, readTimeSpan, estimatePhaseDeadline } from '../../src/utils/roundUtils';
import { ROUND_REGISTRATION_END_OFFSET } from '../../src/constants';
import { DEFAULT_ROUND } from '../fixtures/round.fixture';

describe('roundUtils', () => {
    it('getCommitmentData', () => {
        expect(getCommitmentData('CoinJoinCoordinatorIdentifier', '001234')).toEqual(
            '1d436f696e4a6f696e436f6f7264696e61746f724964656e746966696572001234',
        );
    });

    it('readTimeSpan', () => {
        expect(readTimeSpan('0d 0h 0m 1s')).toEqual(1000);
        expect(readTimeSpan('1d 0h 0m 0s')).toEqual(24 * 60 * 60000);
        expect(readTimeSpan('1d 2h 0m 0s')).toEqual(26 * 60 * 60000);
        expect(readTimeSpan('1d 2h 3m 30s')).toEqual(26 * 60 * 60000 + 3 * 60000 + 30000);
        expect(readTimeSpan('d h m s')).toEqual(0);
    });

    it('estimatePhaseDeadline', () => {
        const round = {
            ...DEFAULT_ROUND,
            coinjoinState: {
                events: [
                    {
                        Type: 'RoundCreated',
                        roundParameters: {
                            connectionConfirmationTimeout: '0d 0h 1m 0s',
                            outputRegistrationTimeout: '0d 0h 2m 0s',
                            transactionSigningTimeout: '0d 0h 3m 0s',
                        },
                    },
                ],
            },
        } as typeof DEFAULT_ROUND;

        const base = new Date(round.inputRegistrationEnd).getTime() + ROUND_REGISTRATION_END_OFFSET;
        expect(estimatePhaseDeadline(DEFAULT_ROUND)).toEqual(base);

        // result may vary +-5 milliseconds
        const expectInRange = (result: number, expected: number) => {
            expect(result).toBeGreaterThanOrEqual(expected - 5);
            expect(result).toBeLessThan(expected + 5);
        };

        const timeouts = 60000; // each phase timeout of DEFAULT_ROUND is set to 1 min.
        expectInRange(
            estimatePhaseDeadline({
                ...round,
                phase: 1,
            }),
            Date.now() + timeouts,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                phase: 2,
            }),
            Date.now() + timeouts * 2,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                phase: 3,
            }),
            Date.now() + timeouts * 3,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                phase: 4,
            }),
            Date.now(),
        );
    });
});
