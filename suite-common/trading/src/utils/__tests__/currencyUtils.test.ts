import {
    buildTradingBaseCurrencyOptionFromFiat,
    buildTradingFiatOption,
    getCurrencyLabel,
    getSupportedFiatCurrencyWithFallback,
    mapFiatCurrencyCodeToBaseCurrencyCode,
} from '../currencyUtils';

describe('currencyUtils', () => {
    describe('buildTradingFiatOption', () => {
        it('should return option with value and full currency-name label', () => {
            expect(buildTradingFiatOption('czk')).toStrictEqual({
                value: 'czk',
                label: 'Czech Koruna',
            });
            expect(buildTradingFiatOption('usd')).toStrictEqual({
                value: 'usd',
                label: 'United States Dollar',
            });
        });
    });

    describe('mapFiatCurrencyCodeToBaseCurrencyCode', () => {
        it('should return undefined for undefined', () => {
            expect(mapFiatCurrencyCodeToBaseCurrencyCode(undefined)).toBeUndefined();
        });

        it('should return undefined for empty string', () => {
            expect(mapFiatCurrencyCodeToBaseCurrencyCode('')).toBeUndefined();
        });

        it('should return code for valid base currency', () => {
            expect(mapFiatCurrencyCodeToBaseCurrencyCode('usd')).toBe('usd');
            expect(mapFiatCurrencyCodeToBaseCurrencyCode('eur')).toBe('eur');
        });

        it('should return undefined for invalid base currency', () => {
            expect(mapFiatCurrencyCodeToBaseCurrencyCode('xyz')).toBeUndefined();
            expect(mapFiatCurrencyCodeToBaseCurrencyCode('invalid')).toBeUndefined();
        });
    });

    describe('buildTradingBaseCurrencyOptionFromFiat', () => {
        it('should return option for valid fiat currency code', () => {
            expect(buildTradingBaseCurrencyOptionFromFiat('eur')).toStrictEqual({
                value: 'eur',
                label: 'EUR',
            });
        });

        it('should fall back to usd for undefined', () => {
            expect(buildTradingBaseCurrencyOptionFromFiat(undefined)).toStrictEqual({
                value: 'usd',
                label: 'USD',
            });
        });

        it('should fall back to usd for invalid code', () => {
            expect(buildTradingBaseCurrencyOptionFromFiat('xyz')).toStrictEqual({
                value: 'usd',
                label: 'USD',
            });
        });
    });

    describe('getCurrencyLabel', () => {
        it('should return label from supported currencies map', () => {
            expect(getCurrencyLabel('czk')).toBe('Czech Koruna');
        });

        it('should return uppercase code otherwise', () => {
            expect(getCurrencyLabel('xyz')).toBe('XYZ');
        });
    });

    describe('getSupportedFiatCurrencyWithFallback', () => {
        it('should return code for supported fiat currency', () => {
            expect(getSupportedFiatCurrencyWithFallback('eur')).toBe('eur');
            expect(getSupportedFiatCurrencyWithFallback('czk')).toBe('czk');
        });

        it('should return usd for unsupported currency', () => {
            expect(getSupportedFiatCurrencyWithFallback('btc')).toBe('usd');
            expect(getSupportedFiatCurrencyWithFallback('xyz')).toBe('usd');
        });
    });
});
