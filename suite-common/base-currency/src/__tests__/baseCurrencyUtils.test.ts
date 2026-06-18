import { BigNumber } from '@trezor/utils';

import {
    fromBaseCurrencyToCryptoUnit,
    parseBaseCurrencyToFormattedCrypto,
    parseCryptoToFormattedBaseCurrency,
    toFiatCurrency,
} from '../baseCurrencyUtils';

const rate = 3007.1079886708517;
const rateString = '3007.1079886708517';

describe('base currency utils: toFiatCurrency', () => {
    it('converts crypto amount to base currency', () => {
        expect(toFiatCurrency({ amount: '1', rate })?.toFixed(2)).toBe('3007.11');
        expect(toFiatCurrency({ amount: '0', rate })?.toFixed(2)).toBe('0.00');
        expect(toFiatCurrency({ amount: '1.00000000000', rate })?.toFixed(2)).toBe('3007.11');
    });

    it('returns null for non-numeric amount', () => {
        expect(toFiatCurrency({ amount: '12133.3131.3141.4', rate })).toBe(null);
    });

    it('returns null when rate is missing', () => {
        expect(toFiatCurrency({ amount: '1', rate: undefined })).toBe(null);
    });
});

describe('base currency utils: fromBaseCurrencyToCryptoUnit', () => {
    it('converts base currency amount to crypto unit', () => {
        expect(fromBaseCurrencyToCryptoUnit({ fiatAmount: rateString, rate })?.toFixed(2)).toBe(
            '1.00',
        );
        expect(fromBaseCurrencyToCryptoUnit({ fiatAmount: '0', rate })?.toFixed(2)).toBe('0.00');
    });

    it('returns null for non-numeric amount', () => {
        expect(fromBaseCurrencyToCryptoUnit({ fiatAmount: '12133.3131.3141.4', rate })).toBe(null);
    });

    it('supports comma decimal separator', () => {
        expect(
            fromBaseCurrencyToCryptoUnit({ fiatAmount: '3007,1079886708517', rate })?.toFixed(2),
        ).toBe('1.00');
    });

    it('returns null when rate is missing', () => {
        expect(fromBaseCurrencyToCryptoUnit({ fiatAmount: '1', rate: undefined })).toBe(null);
    });
});

describe('base currency utils: formatted conversions', () => {
    it('formats crypto to base currency', () => {
        expect(
            parseCryptoToFormattedBaseCurrency({
                areSatsDisplayed: false,
                baseCurrencyToSats: false,
                symbol: 'btc',
                value: new BigNumber('1'),
                rate,
                baseCurrencyCode: 'usd',
            }),
        ).toBe('3007.11');
    });

    it('formats BTC base currency as sats when sats are displayed', () => {
        expect(
            parseCryptoToFormattedBaseCurrency({
                areSatsDisplayed: true,
                baseCurrencyToSats: false,
                symbol: 'btc',
                value: new BigNumber('1'),
                rate: 1,
                baseCurrencyCode: 'btc',
            }),
        ).toBe('100000000');
    });

    it('formats base currency to crypto', () => {
        expect(
            parseBaseCurrencyToFormattedCrypto({
                areSatsDisplayed: false,
                isCryptoInSats: false,
                value: new BigNumber(rateString),
                rate,
                cryptoDecimals: 8,
            }),
        ).toBe('1.00000000');
    });
});
