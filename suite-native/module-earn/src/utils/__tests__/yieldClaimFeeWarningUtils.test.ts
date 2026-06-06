import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { shouldShowClaimFeeWarning } from '../yieldClaimFeeWarningUtils';

const fiatAmount = (amount: string) => asBaseCurrencyAmount(new BigNumber(amount));

describe('shouldShowClaimFeeWarning', () => {
    it('shows warning only when fee fiat exceeds rewards fiat', () => {
        expect(
            shouldShowClaimFeeWarning({
                feeFiatAmount: fiatAmount('4.76'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe(true);

        expect(
            shouldShowClaimFeeWarning({
                feeFiatAmount: fiatAmount('3.75'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe(false);

        expect(
            shouldShowClaimFeeWarning({
                feeFiatAmount: fiatAmount('1.25'),
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe(false);
    });

    it('hides warning when fiat data is incomplete', () => {
        expect(
            shouldShowClaimFeeWarning({
                feeFiatAmount: null,
                totalFiatClaimableAmount: fiatAmount('3.75'),
            }),
        ).toBe(false);

        expect(
            shouldShowClaimFeeWarning({
                feeFiatAmount: fiatAmount('4.76'),
                totalFiatClaimableAmount: null,
            }),
        ).toBe(false);
    });
});
