import * as fixtures from '../__fixtures__/buyUtils';
import { getAmountLimits, processQuotes } from '../buyUtils';

const { MIN_MAX_QUOTES_OK, MIN_MAX_QUOTES_LOW, MIN_MAX_QUOTES_HIGH, ALTERNATIVE_QUOTES } = fixtures;

describe('coinmarket/buy utils', () => {
    it('getAmountLimits', () => {
        const quoteRequestFiat = {
            wantCrypto: false,
            country: 'CZ',
            fiatCurrency: 'EUR',
            receiveCurrency: 'BTC',
            fiatStringAmount: '10',
        };
        const quoteRequestCrypto = {
            wantCrypto: true,
            country: 'CZ',
            fiatCurrency: 'EUR',
            receiveCurrency: 'BTC',
            receiveStringAmount: '0.001',
        };

        expect(getAmountLimits({ ...quoteRequestFiat }, MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits({ ...quoteRequestCrypto }, MIN_MAX_QUOTES_OK)).toBe(undefined);

        expect(getAmountLimits(quoteRequestFiat, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'EUR',
            minFiat: 20,
        });
        expect(getAmountLimits(quoteRequestCrypto, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'BTC',
            minCrypto: 0.002,
        });

        expect(getAmountLimits(quoteRequestFiat, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
            currency: 'EUR',
            maxFiat: 17045.0,
        });
        expect(getAmountLimits(quoteRequestCrypto, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
            currency: 'BTC',
            maxCrypto: 1.67212968,
        });
    });
    it('processQuotes', () => {
        const onlyBaseQuotes = MIN_MAX_QUOTES_OK.map(q => ({ ...q }));
        const withAlternative = ALTERNATIVE_QUOTES.map(q => ({ ...q }));

        expect(processQuotes([])).toStrictEqual([[], []]);

        expect(processQuotes(onlyBaseQuotes)).toStrictEqual([onlyBaseQuotes, []]);
        expect(processQuotes(withAlternative)).toStrictEqual([
            withAlternative.filter(q => !q.tags || !q.tags.includes('alternativeCurrency')),
            withAlternative.filter(q => q.tags && q.tags.includes('alternativeCurrency')),
        ]);
    });
});
