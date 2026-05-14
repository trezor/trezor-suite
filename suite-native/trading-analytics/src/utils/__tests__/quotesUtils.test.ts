import type { CoinInfo, SellFiatTrade } from 'invity-api';

import { banxaCreditCardSellQuote, coins } from '@suite-native/trading-fixtures';

import { getAnalyticsTradingSellPayload } from '../quotesUtils';

describe('quotesUtils', () => {
    describe('getAnalyticsTradingSellPayload', () => {
        it('should return null when coinInfo is undefined', () => {
            const quote = banxaCreditCardSellQuote;
            const result = getAnalyticsTradingSellPayload({
                quote,
                coinInfo: undefined,
            });

            expect(result).toBeNull();
        });

        it('should return null when quote is undefined', () => {
            const coinInfo = coins.ethereum as CoinInfo;
            const result = getAnalyticsTradingSellPayload({
                quote: undefined,
                coinInfo,
            });

            expect(result).toBeNull();
        });

        it('should return null when quote.cryptoCurrency is undefined', () => {
            const quote = {
                ...banxaCreditCardSellQuote,
                cryptoCurrency: undefined,
            } as unknown as SellFiatTrade;
            const coinInfo = coins.ethereum as CoinInfo;

            const result = getAnalyticsTradingSellPayload({
                quote,
                coinInfo,
            });

            expect(result).toBeNull();
        });

        it('should return correct payload otherwise', () => {
            const quote = banxaCreditCardSellQuote;
            const coinInfo = coins.ethereum as CoinInfo;

            const result = getAnalyticsTradingSellPayload({
                quote,
                coinInfo,
            });

            expect(result).toEqual({
                cryptoLabel: 'ETH',
                cryptoNetworkSymbol: 'eth',
                cryptoContractAddress: undefined,
                receiveMethod: 'creditCard',
                countryOfResidence: 'CZ',
                exchangeName: 'banxa-sell',
            });
        });
    });
});
