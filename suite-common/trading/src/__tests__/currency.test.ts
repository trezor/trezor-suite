import { isSupportedFiatCurrency, isTradingFiatCurrencyOption } from '../currency';

describe('currency', () => {
    describe('isTradingFiatCurrencyOption', () => {
        it('returns true for valid fiat option with value and label', () => {
            expect(isTradingFiatCurrencyOption({ value: 'usd', label: 'US Dollar' })).toBe(true);
            expect(isTradingFiatCurrencyOption({ value: 'eur', label: 'Euro' })).toBe(true);
            expect(isTradingFiatCurrencyOption({ value: 'czk', label: 'Czech Koruna' })).toBe(true);
        });

        it('returns false for non-null non-object', () => {
            expect(isTradingFiatCurrencyOption(null)).toBe(false);
            expect(isTradingFiatCurrencyOption(undefined)).toBe(false);
            expect(isTradingFiatCurrencyOption('usd')).toBe(false);
            expect(isTradingFiatCurrencyOption(123)).toBe(false);
        });

        it('returns false for object with value but unsupported currency code', () => {
            expect(isTradingFiatCurrencyOption({ value: 'xyz', label: 'Unknown' })).toBe(false);
            expect(isTradingFiatCurrencyOption({ value: 'btc', label: 'Bitcoin' })).toBe(false);
        });

        it('returns false for object with value but missing or non-string label', () => {
            expect(isTradingFiatCurrencyOption({ value: 'usd' })).toBe(false);
            expect(isTradingFiatCurrencyOption({ value: 'usd', label: 123 })).toBe(false);
            expect(isTradingFiatCurrencyOption({ value: 'usd', label: null })).toBe(false);
        });

        it('returns false for object with label but missing or non-string value', () => {
            expect(isTradingFiatCurrencyOption({ label: 'US Dollar' })).toBe(false);
            expect(isTradingFiatCurrencyOption({ value: 123, label: 'US Dollar' })).toBe(false);
        });
    });

    describe('isSupportedFiatCurrency', () => {
        it('returns true for supported fiat codes', () => {
            expect(isSupportedFiatCurrency('usd')).toBe(true);
            expect(isSupportedFiatCurrency('eur')).toBe(true);
        });

        it('returns false for unsupported strings', () => {
            expect(isSupportedFiatCurrency('xyz')).toBe(false);
            expect(isSupportedFiatCurrency('btc')).toBe(false);
        });
    });
});
