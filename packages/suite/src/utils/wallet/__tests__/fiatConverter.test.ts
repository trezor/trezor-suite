import * as utils from '@suite-common/wallet-utils';

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
        expect(utils.toFiatCurrency('1', 'czk', ratesETH.rates)).toBe('3007.11');
        expect(utils.toFiatCurrency('0', 'czk', ratesETH.rates)).toBe('0.00');
        expect(utils.toFiatCurrency('1.00000000000', 'czk', ratesETH.rates)).toBe('3007.11');
        expect(utils.toFiatCurrency('0.12345678910111213', 'eur', ratesETH.rates)).toBe('14.46');
    });

    it('to missing fiat currency', () => {
        expect(utils.toFiatCurrency('1', 'usd', ratesETH.rates)).toBe(null);
        expect(utils.toFiatCurrency('0', 'usd', ratesETH.rates)).toBe(null);
        expect(utils.toFiatCurrency('1.00000000000', 'usd', ratesETH.rates)).toBe(null);
        expect(utils.toFiatCurrency('0.12345678910111213', 'usd', ratesETH.rates)).toBe(null);
    });

    it('non-numeric amount to fiat currency', () => {
        expect(utils.toFiatCurrency('12133.3131.3141.4', 'czk', ratesETH.rates)).toBe(null);
    });

    it('to existing fiat missing network rates', () => {
        // @ts-ignore
        expect(utils.toFiatCurrency('1', 'czk', null)).toBe(null);
    });
});

describe('fiatConverter utils: fromFiatCurrency', () => {
    it('from existing fiat currency', () => {
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('0', 'czk', ratesETH.rates, decimals)).toBe(
            '0.000000000000000000',
        );
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('117.13118845579191', 'eur', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
    });

    it('from missing fiat currency', () => {
        expect(utils.fromFiatCurrency('1', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(utils.fromFiatCurrency('0', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(utils.fromFiatCurrency('1.00000000000', 'usd', ratesETH.rates, decimals)).toBe(null);
        expect(utils.fromFiatCurrency('0.12345678910111213', 'usd', ratesETH.rates, decimals)).toBe(
            null,
        );
    });

    it('non-numeric amount to fiat currency', () => {
        expect(utils.fromFiatCurrency('12133.3131.3141.4', 'czk', ratesETH.rates, decimals)).toBe(
            null,
        );
    });

    it('different decimals', () => {
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, 1)).toBe('1.0');
        expect(utils.fromFiatCurrency('0', 'czk', ratesETH.rates, 0)).toBe('0');
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH.rates, 5)).toBe(
            '1.00000',
        );
    });

    it('from fiat currency with comma decimal separator', () => {
        expect(utils.fromFiatCurrency('3007,1079886708517', 'czk', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('117,13118845579191', 'eur', ratesETH.rates, decimals)).toBe(
            '1.000000000000000000',
        );
    });

    it('missing fiat rates', () => {
        // @ts-ignore
        expect(utils.fromFiatCurrency('1', 'usd', undefined, decimals)).toBe(null);
    });
});
