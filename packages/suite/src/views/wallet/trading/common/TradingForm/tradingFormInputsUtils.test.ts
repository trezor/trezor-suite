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
        expect(getPayAmountInFormUnit('0.5', false)).toBe('0.5');
    });

    it('converts the amount to satoshis when the pay amount is in satoshis', () => {
        expect(getPayAmountInFormUnit('0.5', true)).toBe('50000000');
    });

    it('drops an amount that is not a number', () => {
        expect(getPayAmountInFormUnit('', true)).toBeUndefined();
    });
});
