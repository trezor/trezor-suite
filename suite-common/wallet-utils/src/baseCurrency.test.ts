import { BigNumber } from '@trezor/utils';

import { parseBaseCurrencyToFormattedCrypto } from './baseCurrency';

describe('parseBaseCurrencyToFormattedCrypto', () => {
    const params = {
        areSatsDisplayed: false,
        isCryptoInSats: false,
        value: new BigNumber(1000),
        rate: 24.5,
        cryptoDecimals: 6,
    };

    it('rounds half up by default', () => {
        expect(parseBaseCurrencyToFormattedCrypto(params)).toBe('40.816327');
    });

    it('rounds with the given rounding mode', () => {
        expect(
            parseBaseCurrencyToFormattedCrypto({ ...params, roundingMode: BigNumber.ROUND_DOWN }),
        ).toBe('40.816326');
    });
});
