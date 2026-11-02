import { typographyStylesBase } from '@trezor/theme';

import { getPayAmountInFormUnit, getTradingAmountInputStyle } from './tradingFormInputsUtils';

const { fontSize: maxFontSize } = typographyStylesBase['headline-md'];
const minFontSize = Math.ceil(maxFontSize / 2);

describe('getTradingAmountInputStyle', () => {
    it.each(['', '0.1', '0,1'])(
        'uses the full font size for an empty or short value (%p)',
        value => {
            expect(getTradingAmountInputStyle(value).fontSize).toBe(maxFontSize);
        },
    );

    it.each([
        '111,111,111,111',
        '111\u00A0111\u00A0111\u00A0111',
        '0.00000000000',
        '0,00000000000',
    ])('shrinks a value by its displayed length (%p)', value => {
        expect(getTradingAmountInputStyle(value).fontSize).toBeLessThan(maxFontSize);
    });

    it('does not shrink below half of the full font size', () => {
        expect(getTradingAmountInputStyle('1'.repeat(50)).fontSize).toBe(minFontSize);
    });
});

describe('getPayAmountInFormUnit', () => {
    it('keeps the amount when the pay amount is in whole units', () => {
        expect(
            getPayAmountInFormUnit({ amount: '0.5', decimals: 18, shouldSendInSats: false }),
        ).toBe('0.5');
    });

    it('converts the amount to satoshis when the pay amount is in satoshis', () => {
        expect(
            getPayAmountInFormUnit({ amount: '0.5', decimals: 18, shouldSendInSats: true }),
        ).toBe('50000000');
    });

    it('truncates the amount to the asset decimals', () => {
        expect(
            getPayAmountInFormUnit({
                amount: '365.32229899',
                decimals: 6,
                shouldSendInSats: false,
            }),
        ).toBe('365.322298');
    });

    it('truncates the amount to the asset decimals before converting it to satoshis', () => {
        expect(
            getPayAmountInFormUnit({
                amount: '365.32229899',
                decimals: 6,
                shouldSendInSats: true,
            }),
        ).toBe('36532229800');
    });

    it('drops an amount that is not a number', () => {
        expect(
            getPayAmountInFormUnit({ amount: '', decimals: 8, shouldSendInSats: true }),
        ).toBeUndefined();
    });
});
