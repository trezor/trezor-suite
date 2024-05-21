import { fromFiatCurrency, toFiatCurrency } from '../fiatConverterUtils';

const rateNumber = 3007.1079886708517;
const rateString = '3007.1079886708517';
const decimals = 18;

describe('fiatConverter utils: toFiatCurrency', () => {
    it('to existing fiat currency', () => {
        expect(toFiatCurrency('1', rateNumber)).toBe('3007.11');
        expect(toFiatCurrency('0', rateNumber)).toBe('0.00');
        expect(toFiatCurrency('1.00000000000', rateNumber)).toBe('3007.11');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(toFiatCurrency('12133.3131.3141.4', rateNumber)).toBe(null);
    });

    it('to existing fiat missing network rates', () => {
        expect(toFiatCurrency('1', undefined)).toBe(null);
    });
});

describe('fiatConverter utils: fromFiatCurrency', () => {
    it('from existing fiat currency', () => {
        expect(fromFiatCurrency(rateString, decimals, rateNumber)).toBe('1.000000000000000000');
        expect(fromFiatCurrency('0', decimals, rateNumber)).toBe('0.000000000000000000');
        expect(fromFiatCurrency(rateString, decimals, rateNumber)).toBe('1.000000000000000000');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(fromFiatCurrency('12133.3131.3141.4', decimals, rateNumber)).toBe(null);
    });

    it('different decimals', () => {
        expect(fromFiatCurrency(rateString, 1, rateNumber)).toBe('1.0');
        expect(fromFiatCurrency('0', 0, rateNumber)).toBe('0');
        expect(fromFiatCurrency(rateString, 5, rateNumber)).toBe('1.00000');
    });

    it('from fiat currency with comma decimal separator', () => {
        expect(fromFiatCurrency('3007,1079886708517', decimals, rateNumber)).toBe(
            '1.000000000000000000',
        );
    });

    it('missing fiat rates', () => {
        expect(fromFiatCurrency('1', decimals, undefined)).toBe(null);
    });
});
