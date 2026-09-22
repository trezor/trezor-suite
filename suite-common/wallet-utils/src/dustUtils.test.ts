import { BigNumber } from '@trezor/utils';

import { getCryptoDustLimit, isCryptoDustAmount, isDustHolding } from './dustUtils';

describe('how little counts as dust', () => {
    it('stops at the smallest amount the interface prints', () => {
        expect(getCryptoDustLimit(18).toFixed()).toBe('0.00001');
    });

    it('never calls a whole unit of a coarse token dust', () => {
        expect(getCryptoDustLimit(2).toFixed()).toBe('0.01');
        expect(isCryptoDustAmount({ cryptoBalance: '0.01', decimals: 2 })).toBe(false);
    });

    it('goes by the amount when nothing can price it', () => {
        expect(
            isDustHolding({ cryptoBalance: '0.000001', decimals: 18, fiatValue: undefined }),
        ).toBe(true);
        expect(isDustHolding({ cryptoBalance: '0.5', decimals: 18, fiatValue: undefined })).toBe(
            false,
        );
    });

    it('goes by what it is worth when something can', () => {
        // A hundredth of a bitcoin is a small number and a lot of money.
        expect(
            isDustHolding({
                cryptoBalance: '0.00002',
                decimals: 8,
                fiatValue: new BigNumber('1.6'),
            }),
        ).toBe(false);

        expect(
            isDustHolding({
                cryptoBalance: '900000000',
                decimals: 18,
                fiatValue: new BigNumber('0.004'),
            }),
        ).toBe(true);
    });
});
