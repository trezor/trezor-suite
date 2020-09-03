import * as fixtures from '../__fixtures__/exchangeUtils';
import { getAmountLimits, isQuoteError, splitQuotes, formatCryptoAmount } from '../exchangeUtils';

const { MIN_MAX_QUOTES_OK, MIN_MAX_QUOTES_LOW, MIN_MAX_QUOTES_CANNOT_TRADE } = fixtures;

describe('coinmarket/exchange utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits(MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits(MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'LTC',
            max: undefined,
            min: 0.35121471511608626,
        });
        expect(getAmountLimits(MIN_MAX_QUOTES_CANNOT_TRADE)).toBe(undefined);
    });

    it('isQuoteError', () => {
        expect(isQuoteError(MIN_MAX_QUOTES_OK[0])).toBe(false);
        expect(isQuoteError(MIN_MAX_QUOTES_LOW[0])).toBe(true);
        expect(isQuoteError(MIN_MAX_QUOTES_CANNOT_TRADE[0])).toBe(true);
    });

    it('splitQuotes', () => {
        expect(splitQuotes(MIN_MAX_QUOTES_OK)).toStrictEqual([MIN_MAX_QUOTES_OK, [], []]);
        expect(splitQuotes(MIN_MAX_QUOTES_CANNOT_TRADE)).toStrictEqual([
            [],
            [],
            MIN_MAX_QUOTES_CANNOT_TRADE,
        ]);
    });

    it('formatCryptoAmount', () => {
        expect(formatCryptoAmount(Number('194.359760816544300225'))).toStrictEqual('194.3598');
    });
});
