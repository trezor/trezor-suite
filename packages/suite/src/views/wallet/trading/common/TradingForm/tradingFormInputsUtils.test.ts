import { typographyStylesBase } from '@trezor/theme';

import { getTradingAmountInputStyle } from './tradingFormInputsUtils';

const { fontSize: maxFontSize } = typographyStylesBase['headline-md'];
const minFontSize = Math.ceil(maxFontSize / 2);

describe('getTradingAmountInputStyle', () => {
    it.each([undefined, '', '0.1'])(
        'uses the full font size for an empty or short value (%p)',
        value => {
            expect(getTradingAmountInputStyle(value).fontSize).toBe(maxFontSize);
        },
    );

    it('does not shrink below half of the full font size', () => {
        expect(getTradingAmountInputStyle('1'.repeat(50)).fontSize).toBe(minFontSize);
    });
});
