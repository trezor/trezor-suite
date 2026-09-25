import { typographyStylesBase } from '@trezor/theme';

import { getTradingAmountInputStyle } from './tradingFormInputsUtils';

const { fontSize: maxFontSize } = typographyStylesBase['headline-md'];
const minFontSize = Math.ceil(maxFontSize / 2);

describe('getTradingAmountInputStyle', () => {
    it.each([undefined, '', '0.1'])(
        'uses the full font size for an empty or short value (%p)',
        value => {
            expect(getTradingAmountInputStyle(value, 'en-US').fontSize).toBe(maxFontSize);
        },
    );

    it('shrinks a value that reaches the full size length only with thousands separators', () => {
        expect(getTradingAmountInputStyle('1'.repeat(12), 'en-US').fontSize).toBeLessThan(
            maxFontSize,
        );
    });

    it('does not shrink below half of the full font size', () => {
        expect(getTradingAmountInputStyle('1'.repeat(50), 'en-US').fontSize).toBe(minFontSize);
    });
});
