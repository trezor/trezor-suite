import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { getClaimFeeWarning } from '../yieldClaimFeeWarningUtils';

const fiatAmount = (amount: string) => asBaseCurrencyAmount(new BigNumber(amount));

describe('getClaimFeeWarning', () => {
    it('warns only when fee fiat exceeds rewards fiat', () => {
        expect(
            getClaimFeeWarning({
                feeFiatAmount: fiatAmount('4.76'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe('fee-exceeds-rewards');

        expect(
            getClaimFeeWarning({
                feeFiatAmount: fiatAmount('3.75'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBeNull();

        expect(
            getClaimFeeWarning({
                feeFiatAmount: fiatAmount('1.25'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBeNull();
    });

    it('reports an unverifiable rewards value when fiat data is incomplete', () => {
        expect(
            getClaimFeeWarning({
                feeFiatAmount: null,
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe('unverifiable-rewards-value');

        expect(
            getClaimFeeWarning({
                feeFiatAmount: fiatAmount('4.76'),
                totalFiatClaimableAmount: null,
            }),
        ).toBe('unverifiable-rewards-value');

        expect(
            getClaimFeeWarning({
                feeFiatAmount: null,
                totalFiatClaimableAmount: null,
            }),
        ).toBe('unverifiable-rewards-value');
    });
});
