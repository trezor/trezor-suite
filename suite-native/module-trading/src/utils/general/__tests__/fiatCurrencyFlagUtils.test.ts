import type { FiatCurrencyCode } from 'invity-api';

import { getFiatCurrencyFlag } from '../fiatCurrencyFlagUtils';

describe('fiatCurrencyFlag', () => {
    it.each([
        ['usd', 'US'],
        ['czk', 'CZ'],
        ['jpy', 'JP'],
        ['eur', 'EU'],
        ['xaf', undefined],
        ['xof', undefined],
    ])('should return %s flag mapping for %s fiat currency', (fiatCurrency, expectedFlag) => {
        expect(getFiatCurrencyFlag(fiatCurrency as FiatCurrencyCode)).toBe(expectedFlag);
    });

    it('should return undefined when fiat currency is not specified', () => {
        expect(getFiatCurrencyFlag()).toBeUndefined();
    });
});
