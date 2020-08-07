import * as fixtures from '../__fixtures__/buyUtils';
import { getAmountLimits, processQuotes, createQuoteLink } from '../buyUtils';

const {
    QUOTE_REQUEST_FIAT,
    QUOTE_REQUEST_CRYPTO,
    MIN_MAX_QUOTES_OK,
    MIN_MAX_QUOTES_LOW,
    MIN_MAX_QUOTES_HIGH,
    ALTERNATIVE_QUOTES,
} = fixtures;

describe('coinmarket/buy utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits({ ...QUOTE_REQUEST_FIAT }, MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits({ ...QUOTE_REQUEST_CRYPTO }, MIN_MAX_QUOTES_OK)).toBe(undefined);

        expect(getAmountLimits(QUOTE_REQUEST_FIAT, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'EUR',
            minFiat: 20,
        });
        expect(getAmountLimits(QUOTE_REQUEST_CRYPTO, MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'BTC',
            minCrypto: 0.002,
        });

        expect(getAmountLimits(QUOTE_REQUEST_FIAT, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
            currency: 'EUR',
            maxFiat: 17045.0,
        });
        expect(getAmountLimits(QUOTE_REQUEST_CRYPTO, MIN_MAX_QUOTES_HIGH)).toStrictEqual({
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
    it('createQuoteLink', () => {
        expect(createQuoteLink(QUOTE_REQUEST_FIAT)).toStrictEqual(
            `${window.location.href}/qf/CZ/EUR/10/BTC`,
        );
        expect(createQuoteLink(QUOTE_REQUEST_CRYPTO)).toStrictEqual(
            `${window.location.href}/qc/CZ/EUR/0.001/BTC`,
        );
    });
});
