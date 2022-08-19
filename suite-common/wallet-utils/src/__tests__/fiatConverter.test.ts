import { fromFiatCurrency, toFiatCurrency } from '../fiatConverterUtils';

const ratesETH = {
    symbol: 'eth',
    rates: {
        czk: 3007.1079886708517,
        eos: 36.852136278995445,
        eur: 117.13118845579191,
        gbp: 100.43721437661289,
    },
    timestamp: Date.now(),
} as const;
const decimals = 18;

describe('fiatConverter utils: toFiatCurrency', () => {
    it('to existing fiat currency', () => {
        expect(toFiatCurrency('1', 'czk', ratesETH.rates)).toBe('3007.11');
        expect(toFiatCurrency('0', 'czk', ratesETH.rates)).toBe('0.00');
        expect(toFiatCurrency('1.00000000000', 'czk', ratesETH.rates)).toBe('3007.11');
        expect(toFiatCurrency('0.12345678910111213', 'eur', ratesETH.rates)).toBe('14.46');
    });

    it('to missing fiat currency', () => {
        expect(toFiatCurrency('1', 'usd', ratesETH.rates)).toBe(null);
        expect(toFiatCurrency('0', 'usd', ratesETH.rates)).toBe(null);
        expect(toFiatCurrency('1.00000000000', 'usd', ratesETH.rates)).toBe(null);
        expect(toFiatCurrency('0.12345678910111213', 'usd', ratesETH.rates)).toBe(null);
    });

    it('non-numeric amount to fiat currency', () => {
        expect(toFiatCurrency('12133.3131.3141.4', 'czk', ratesETH.rates)).toBe(null);
    });

    it('to existing fiat missing network rates', () => {
        // @ts-expect-error
        expect(toFiatCurrency('1', 'czk', null)).toBe(null);
    });
});

describe('fiatConverter utils: fromFiatCurrency', () => {
    it('from existing fiat currency', () => {
        expect(fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(fromFiatCurrency('0', 'czk', ratesETH.rates, decimals)).toBe('0.000000000000000000');
        expect(fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(fromFiatCurrency('117.13118845579191', 'eur', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
    });

    it('from missing fiat currency', () => {
        expect(fromFiatCurrency('1', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(fromFiatCurrency('0', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(fromFiatCurrency('1.00000000000', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(fromFiatCurrency('0.12345678910111213', 'usd', ratesETH.rates, decimals)).toBe(null);
    });

    it('non-numeric amount to fiat currency', () => {
        expect(fromFiatCurrency('12133.3131.3141.4', 'czk', ratesETH.rates, decimals)).toBe(null);
    });

    it('different decimals', () => {
        expect(fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, 1)).toBe('1.0');
        expect(fromFiatCurrency('0', 'czk', ratesETH.rates, 0)).toBe('0');
        expect(fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, 5)).toBe('1.00000');
    });

    it('from fiat currency with comma decimal separator', () => {
        expect(fromFiatCurrency('3007,1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(fromFiatCurrency('117,13118845579191', 'eur', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
    });

    it('missing fiat rates', () => {
        expect(fromFiatCurrency('1', 'usd', undefined, decimals)).toBe(null);
    });
});
