import { CryptoId } from 'invity-api';

import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import * as fixtures from 'src/utils/wallet/coinmarket/__fixtures__/exchangeUtils';
import {
    coinmarketGetExchangeReceiveCryptoId,
    getAmountLimits,
    getStatusMessage,
    getSuccessQuotesOrdered,
    isQuoteError,
} from 'src/utils/wallet/coinmarket/exchangeUtils';

jest.mock('src/hooks/wallet/coinmarket/useCoinmarketInfo', () => ({
    ...jest.requireActual('src/hooks/wallet/coinmarket/useCoinmarketInfo'),
    useCoinmarketInfo: jest.fn(),
}));

const { MIN_MAX_QUOTES_OK, MIN_MAX_QUOTES_LOW, MIN_MAX_QUOTES_CANNOT_TRADE } = fixtures;

describe('coinmarket/exchange utils', () => {
    const cryptoIdToCoinSymbol = (useCoinmarketInfo as jest.Mock).mockImplementation(() => 'LTC');

    it('getAmountLimits', () => {
        expect(
            getAmountLimits({
                quotes: MIN_MAX_QUOTES_OK,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);
        expect(
            getAmountLimits({
                quotes: MIN_MAX_QUOTES_LOW,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toStrictEqual({
            currency: 'ltc',
            maxCrypto: undefined,
            minCrypto: '0.35121471511608626',
        });
        expect(
            getAmountLimits({
                quotes: MIN_MAX_QUOTES_CANNOT_TRADE,
                currency: cryptoIdToCoinSymbol().toLowerCase(),
            }),
        ).toBe(undefined);
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
