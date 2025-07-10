import { fromFiatCurrency, toFiatCurrency } from '../fiatConverterUtils';

const rate = 3007.1079886708517;
const rateString = '3007.1079886708517';

describe('fiatConverter utils: toFiatCurrency', () => {
    it('to existing fiat currency', () => {
        expect(toFiatCurrency({ amount: '1', rate })?.toFixed(2)).toBe('3007.11');
        expect(toFiatCurrency({ amount: '0', rate })?.toFixed(2)).toBe('0.00');
        expect(toFiatCurrency({ amount: '1.00000000000', rate })?.toFixed(2)).toBe('3007.11');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(toFiatCurrency({ amount: '12133.3131.3141.4', rate })).toBe(null);
    });

    it('to existing fiat missing network rates', () => {
        expect(toFiatCurrency({ amount: '1', rate: undefined })).toBe(null);
    });
});

describe('fiatConverter utils: fromFiatCurrency', () => {
    it('from existing fiat currency', () => {
        expect(fromFiatCurrency({ fiatAmount: rateString, rate })?.toFixed(2)).toBe('1.00');
        expect(fromFiatCurrency({ fiatAmount: '0', rate })?.toFixed(2)).toBe('0.00');
        expect(fromFiatCurrency({ fiatAmount: rateString, rate })?.toFixed(2)).toBe('1.00');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(fromFiatCurrency({ fiatAmount: '12133.3131.3141.4', rate })).toBe(null);
    });

    it('different decimals', () => {
        expect(fromFiatCurrency({ fiatAmount: rateString, rate })?.toFixed(2)).toBe('1.00');
        expect(fromFiatCurrency({ fiatAmount: '0', rate })?.toFixed(2)).toBe('0.00');
        expect(fromFiatCurrency({ fiatAmount: rateString, rate })?.toFixed(2)).toBe('1.00');
    });

    it('from fiat currency with comma decimal separator', () => {
        expect(fromFiatCurrency({ fiatAmount: '3007,1079886708517', rate })?.toFixed(2)).toBe(
            '1.00',
        );
    });

    it('missing fiat rates', () => {
        expect(fromFiatCurrency({ fiatAmount: '1', rate: undefined })).toBe(null);
    });
});
