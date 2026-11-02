import { type GeneralPrecomposedLevels } from '@suite-common/wallet-types';

import { getFeeAvailability } from './feeAvailability';
import { createFeeLevel } from '../../__fixtures__/feeLevels';

const final = createFeeLevel({ fee: '100' });
const insufficient = { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } as const;

describe('fee availability', () => {
    it.each([
        [
            'normal unavailable with an affordable low level',
            { normal: insufficient, low: final },
            'normal',
        ],
        [
            'custom unavailable with a valid normal level',
            { normal: final, custom: insufficient },
            'custom',
        ],
        ['all levels unavailable', { normal: insufficient, low: insufficient }, 'normal'],
    ] as const)(
        'explains %s even when a fallback estimate exists',
        (_name, feeLevels, selectedFee) => {
            expect(getFeeAvailability({ feeLevels, selectedFee, isLoading: false })).toEqual({
                isFeeUnavailable: true,
                feeError: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
            });
        },
    );

    it('preserves the actual reason instead of reporting insufficient funds for every error', () => {
        expect(
            getFeeAvailability({
                feeLevels: { normal: { type: 'error', error: 'AMOUNT_IS_LESS_THAN_RESERVE' } },
                selectedFee: 'normal',
                isLoading: false,
            }).feeError,
        ).toBe('AMOUNT_IS_LESS_THAN_RESERVE');
    });

    it.each([
        [{}, undefined, false],
        [{ normal: insufficient }, 'normal', true],
        [{ normal: insufficient, low: final }, 'low', false],
    ] as const)(
        'does not mark empty, loading or valid selected fees unavailable',
        (feeLevels, selectedFee, isLoading) => {
            expect(
                getFeeAvailability({
                    feeLevels: feeLevels as GeneralPrecomposedLevels,
                    selectedFee,
                    isLoading,
                }).isFeeUnavailable,
            ).toBe(false);
        },
    );
});
