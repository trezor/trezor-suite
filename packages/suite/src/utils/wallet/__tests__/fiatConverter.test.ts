import * as utils from '../fiatConverterUtils';

describe('fiatConverter utils: toFiatCurrency', () => {
    const ratesETH = {
        network: 'eth',
        rates: {
            czk: 3007.1079886708517,
            eos: 36.852136278995445,
            eur: 117.13118845579191,
            gbp: 100.43721437661289,
        },
    };

    it('to existing fiat currency', () => {
        expect(utils.toFiatCurrency('1', 'czk', ratesETH)).toBe('3007.11');
        expect(utils.toFiatCurrency('0', 'czk', ratesETH)).toBe('0.00');
        expect(utils.toFiatCurrency('1.00000000000', 'czk', ratesETH)).toBe('3007.11');
        expect(utils.toFiatCurrency('0.12345678910111213', 'eur', ratesETH)).toBe('14.46');
    });

    it('to missing fiat currency', () => {
        expect(utils.toFiatCurrency('1', 'usd', ratesETH)).toBe('');
        expect(utils.toFiatCurrency('0', 'usd', ratesETH)).toBe('');
        expect(utils.toFiatCurrency('1.00000000000', 'usd', ratesETH)).toBe('');
        expect(utils.toFiatCurrency('0.12345678910111213', 'usd', ratesETH)).toBe('');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(utils.toFiatCurrency('12133.3131.3141.4', 'czk', ratesETH)).toBe('');
    });
});

describe('fiatConverter utils: fromFiatCurrency', () => {
    const ratesETH = {
        network: 'eth',
        rates: {
            czk: 3007.1079886708517,
            eos: 36.852136278995445,
            eur: 117.13118845579191,
            gbp: 100.43721437661289,
        },
    };
    const decimals = 18;

    it('from existing fiat currency', () => {
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('0', 'czk', ratesETH, decimals)).toBe('0.000000000000000000');
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('117.13118845579191', 'eur', ratesETH, decimals)).toBe(
            '1.000000000000000000',
        );
    });

    it('from missing fiat currency', () => {
        expect(utils.fromFiatCurrency('1', 'usd', ratesETH, decimals)).toBe('');
        expect(utils.fromFiatCurrency('0', 'usd', ratesETH, decimals)).toBe('');
        expect(utils.fromFiatCurrency('1.00000000000', 'usd', ratesETH, decimals)).toBe('');
        expect(utils.fromFiatCurrency('0.12345678910111213', 'usd', ratesETH, decimals)).toBe('');
    });

    it('non-numeric amount to fiat currency', () => {
        expect(utils.fromFiatCurrency('12133.3131.3141.4', 'czk', ratesETH, decimals)).toBe('');
    });

    it('different decimals', () => {
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH, 1)).toBe('1.0');
        expect(utils.fromFiatCurrency('0', 'czk', ratesETH, 0)).toBe('0');
        expect(utils.fromFiatCurrency('3007.1079886708517', 'czk', ratesETH, 5)).toBe('1.00000');
    });

    it('from fiat currency with comma decimal separator', () => {
        expect(utils.fromFiatCurrency('3007,1079886708517', 'czk', ratesETH, decimals)).toBe(
            '1.000000000000000000',
        );
        expect(utils.fromFiatCurrency('117,13118845579191', 'eur', ratesETH, decimals)).toBe(
            '1.000000000000000000',
        );
    });
});
