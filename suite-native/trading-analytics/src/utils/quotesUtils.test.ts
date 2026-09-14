import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import type { BuyTrade, CoinInfo, SellFiatTrade } from 'invity-api';

import {
    banxaCreditCardSellQuote,
    coins,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { getAnalyticsTradingBuyPayload, getAnalyticsTradingSellPayload } from './quotesUtils';

const networkConfigDeps = mockNetworkConfigDeps();

describe('quotesUtils', () => {
    describe('getAnalyticsTradingSellPayload', () => {
        it('should return null when coinInfo is undefined', () => {
            const quote = banxaCreditCardSellQuote;
            const result = getAnalyticsTradingSellPayload(networkConfigDeps, {
                quote,
                coinInfo: undefined,
            });

            expect(result).toBeNull();
        });

        it('should return null when quote is undefined', () => {
            const coinInfo = coins.ethereum as CoinInfo;
            const result = getAnalyticsTradingSellPayload(networkConfigDeps, {
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

            const result = getAnalyticsTradingSellPayload(networkConfigDeps, {
                quote,
                coinInfo,
            });

            expect(result).toBeNull();
        });

        it('should return correct payload otherwise', () => {
            const quote = banxaCreditCardSellQuote;
            const coinInfo = coins.ethereum as CoinInfo;

            const result = getAnalyticsTradingSellPayload(networkConfigDeps, {
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

    describe('getAnalyticsTradingBuyPayload', () => {
        it('should return null when coinInfo is undefined', () => {
            const result = getAnalyticsTradingBuyPayload(networkConfigDeps, {
                quote: mercuryoApplePayBuyQuote,
                coinInfo: undefined,
            });

            expect(result).toBeNull();
        });

        it('should return null when quote is undefined', () => {
            const coinInfo = coins.bitcoin as CoinInfo;
            const result = getAnalyticsTradingBuyPayload(networkConfigDeps, {
                quote: undefined,
                coinInfo,
            });

            expect(result).toBeNull();
        });

        it('should return null when quote.receiveCurrency is undefined', () => {
            const quote = {
                ...mercuryoApplePayBuyQuote,
                receiveCurrency: undefined,
            } as unknown as BuyTrade;
            const coinInfo = coins.bitcoin as CoinInfo;

            const result = getAnalyticsTradingBuyPayload(networkConfigDeps, {
                quote,
                coinInfo,
            });

            expect(result).toBeNull();
        });

        it('should return correct payload otherwise', () => {
            const coinInfo = coins.bitcoin as CoinInfo;

            const result = getAnalyticsTradingBuyPayload(networkConfigDeps, {
                quote: mercuryoApplePayBuyQuote,
                coinInfo,
            });

            expect(result).toEqual({
                cryptoLabel: 'BTC',
                cryptoNetworkSymbol: 'btc',
                cryptoContractAddress: undefined,
                paymentMethod: 'applePay',
                countryOfResidence: undefined,
                exchangeName: 'mercuryo',
            });
        });
    });
});
