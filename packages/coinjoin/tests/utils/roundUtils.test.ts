import { getRandomNumberInRange } from '@trezor/utils';

import {
    getCommitmentData,
    readTimeSpan,
    estimatePhaseDeadline,
    transformStatus,
    getAffiliateRequest,
    scheduleDelay,
} from '../../src/utils/roundUtils';
import { ROUND_REGISTRATION_END_OFFSET } from '../../src/constants';
import { DEFAULT_ROUND, STATUS_EVENT, STATUS_TRANSFORMED } from '../fixtures/round.fixture';

// mock random delay function
jest.mock('@trezor/utils', () => {
    const originalModule = jest.requireActual('@trezor/utils');

    return {
        __esModule: true,
        ...originalModule,
        getRandomNumberInRange: jest.fn(originalModule.getRandomNumberInRange),
    };
});

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
            CoinjoinState: {
                Events: [
                    {
                        Type: 'RoundCreated',
                        RoundParameters: {
                            ConnectionConfirmationTimeout: '0d 0h 1m 0s',
                            OutputRegistrationTimeout: '0d 0h 2m 0s',
                            TransactionSigningTimeout: '0d 0h 3m 0s',
                        },
                    },
                ],
            },
        } as typeof DEFAULT_ROUND;

        const base = new Date(round.InputRegistrationEnd).getTime() + ROUND_REGISTRATION_END_OFFSET;
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
                Phase: 1,
            }),
            Date.now() + timeouts,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                Phase: 2,
            }),
            Date.now() + timeouts * 2,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                Phase: 3,
            }),
            Date.now() + timeouts * 3,
        );

        expectInRange(
            estimatePhaseDeadline({
                ...round,
                Phase: 4,
            }),
            Date.now() + timeouts * 3,
        );
    });

    describe('transformStatus', () => {
        it('transform correctly', () => {
            const status = transformStatus(STATUS_EVENT);

            expect(status).toEqual(STATUS_TRANSFORMED);
        });
    });

    // fixtures: https://github.com/trezor/coinjoin-affiliate-server/blob/coordinator-integration/tests/test_response.py
    it('getAffiliateRequest', () => {
        const response = getAffiliateRequest(
            {
                CoordinationFeeRate: {
                    Rate: 0.005,
                    PlebsDontPayThreshold: 1000000,
                },
                AllowedInputAmounts: {
                    Min: 5000,
                    Max: 134375000000,
                },
            } as any, // incomplete roundParams
            Buffer.from(
                '03026113a614bd0b3b193ab33de3b0376d48bf1f87931b08543bfd23d7a0616f65106bf94e6c325e3f9a8627ac6a8ebe71f322edcde26b43add515d81fc306a309a914ff0e7cfc75b05fc1cddbb60f0f5594642991a23f19b4a4794000d4169db20101',
                'hex',
            ).toString('base64'),
        );
        expect(response).toEqual({
            fee_rate: 500000,
            min_registrable_amount: 5000,
            no_fee_threshold: 1000000,
            mask_public_key: '03026113a614bd0b3b193ab33de3b0376d48bf1f87931b08543bfd23d7a0616f65',
            signature:
                '106bf94e6c325e3f9a8627ac6a8ebe71f322edcde26b43add515d81fc306a309a914ff0e7cfc75b05fc1cddbb60f0f5594642991a23f19b4a4794000d4169db2',
            coinjoin_flags_array: [1, 1],
        });
    });

    it('scheduleDelay', () => {
        const resultInRange = (result: number, min: number, max: number) => {
            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
        };

        // default (no min, no max) range 0-10 sec.
        resultInRange(scheduleDelay(60000), 0, 10000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(0, 10000);

        // range 3-10sec.
        resultInRange(scheduleDelay(20000, 3000), 3000, 10000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(3000, 10000);

        // deadlineOffset < 0, range 0-1 sec.
        resultInRange(scheduleDelay(1000, 3000), 0, 1000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(0, 1000);

        // deadline < min, range 9-10 sec.
        resultInRange(scheduleDelay(60000, 61000), 9000, 10000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(9000, 10000);

        // deadline < min && deadline < max, range 49-50 sec.
        resultInRange(scheduleDelay(60000, 61000, 62000), 49000, 50000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(49000, 50000);

        // deadline > min && deadline < max, range 3-20 sec.
        resultInRange(scheduleDelay(30000, 3000, 50000), 3000, 20000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(3000, 20000);

        // min < 0 && deadline < max && deadlineOffset > 0, range 0-2.5 sec.
        resultInRange(scheduleDelay(12500, -3000, 50000), 0, 2500);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(0, 2500);

        // min < 0 && max < 0 && deadlineOffset > 0, range 0-1 sec.
        resultInRange(scheduleDelay(12500, -10000, -5000), 0, 1000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(0, 1000);

        // min < 0 && max < 0 && deadlineOffset < 0, range 0-1 sec.
        resultInRange(scheduleDelay(7500, -10000, -5000), 0, 1000);
        expect(getRandomNumberInRange).toHaveBeenLastCalledWith(0, 1000);
    });
});
