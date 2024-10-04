import { CryptoId } from 'invity-api';
import * as fixtures from '../__fixtures__/exchangeUtils';
import {
    coinmarketGetExchangeReceiveCryptoId,
    getAmountLimits,
    getStatusMessage,
    getSuccessQuotesOrdered,
    isQuoteError,
} from '../exchangeUtils';

const { MIN_MAX_QUOTES_OK, MIN_MAX_QUOTES_LOW, MIN_MAX_QUOTES_CANNOT_TRADE } = fixtures;

describe('coinmarket/exchange utils', () => {
    it('getAmountLimits', () => {
        expect(getAmountLimits(MIN_MAX_QUOTES_OK)).toBe(undefined);
        expect(getAmountLimits(MIN_MAX_QUOTES_LOW)).toStrictEqual({
            currency: 'litecoin',
            maxCrypto: undefined,
            minCrypto: 0.35121471511608626,
        });
        expect(getAmountLimits(MIN_MAX_QUOTES_CANNOT_TRADE)).toBe(undefined);
    });

    it('isQuoteError', () => {
        expect(isQuoteError(MIN_MAX_QUOTES_OK[0])).toBe(false);
        expect(isQuoteError(MIN_MAX_QUOTES_LOW[0])).toBe(true);
        expect(isQuoteError(MIN_MAX_QUOTES_CANNOT_TRADE[0])).toBe(true);
    });

    it('getSuccessQuotesOrdered', () => {
        expect(
            getSuccessQuotesOrdered([
                ...MIN_MAX_QUOTES_OK,
                ...MIN_MAX_QUOTES_LOW,
                ...MIN_MAX_QUOTES_CANNOT_TRADE,
            ]),
        ).toStrictEqual(fixtures.EXCHANGE_SUCCESS_ORDERED_QUOTES);
    });
    it('getStatusMessage', () => {
        expect(getStatusMessage('CONVERTING')).toBe('TR_EXCHANGE_STATUS_CONVERTING');
        expect(getStatusMessage('CONFIRMING')).toBe('TR_EXCHANGE_STATUS_CONFIRMING');
        expect(getStatusMessage('KYC')).toBe('TR_EXCHANGE_STATUS_KYC');
        expect(getStatusMessage('ERROR')).toBe('TR_EXCHANGE_STATUS_ERROR');
        expect(getStatusMessage('SUCCESS')).toBe('TR_EXCHANGE_STATUS_SUCCESS');
    });

    it('coinmarketGetExchangeReceiveCryptoId', () => {
        // default cryptoId
        expect(coinmarketGetExchangeReceiveCryptoId('bitcoin' as CryptoId)).toBe('ethereum');
        expect(coinmarketGetExchangeReceiveCryptoId('litecoin' as CryptoId)).toBe('bitcoin');
        expect(
            coinmarketGetExchangeReceiveCryptoId(
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('bitcoin');

        // already selected
        expect(
            coinmarketGetExchangeReceiveCryptoId('bitcoin' as CryptoId, 'bitcoin' as CryptoId),
        ).toBe('ethereum');
        expect(
            coinmarketGetExchangeReceiveCryptoId(
                'bitcoin' as CryptoId,
                'ethereum--0x0000000000085d4780b73119b644ae5ecd22b376' as CryptoId,
            ),
        ).toBe('ethereum--0x0000000000085d4780b73119b644ae5ecd22b376');
    });
});
