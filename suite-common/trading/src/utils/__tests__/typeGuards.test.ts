import { type TradingTradeType } from '../../types';
import { isBuyTrade, isExchangeTrade, isSellFiatTrade, isSendRejectedError } from '../typeGuards';

describe('typeGuards', () => {
    describe('trade type guards', () => {
        const buyQuote = {
            fiatStringAmount: '10',
            fiatCurrency: 'EUR',
            receiveCurrency: 'bitcoin',
            receiveStringAmount: '0.0005',
        } as TradingTradeType;

        const sellQuote = {
            fiatStringAmount: '10',
            fiatCurrency: 'EUR',
            cryptoCurrency: 'bitcoin',
            cryptoStringAmount: '0.0005',
        } as TradingTradeType;

        const sellQuoteWithoutCryptoAmount = {
            fiatStringAmount: '10',
            fiatCurrency: 'EUR',
        } as TradingTradeType;

        const exchangeQuote = {
            send: 'bitcoin',
            sendStringAmount: '0.01',
            receive: 'litecoin',
            receiveStringAmount: '0.5',
        } as TradingTradeType;

        it('classifies a buy quote', () => {
            expect(isBuyTrade(buyQuote)).toBe(true);
            expect(isSellFiatTrade(buyQuote)).toBe(false);
            expect(isExchangeTrade(buyQuote)).toBe(false);
        });

        it('classifies a sell quote', () => {
            expect(isSellFiatTrade(sellQuote)).toBe(true);
            expect(isBuyTrade(sellQuote)).toBe(false);
            expect(isExchangeTrade(sellQuote)).toBe(false);
        });

        it('classifies a sell quote that has no crypto amount yet', () => {
            expect(isSellFiatTrade(sellQuoteWithoutCryptoAmount)).toBe(true);
            expect(isBuyTrade(sellQuoteWithoutCryptoAmount)).toBe(false);
            expect(isExchangeTrade(sellQuoteWithoutCryptoAmount)).toBe(false);
        });

        it('classifies an exchange quote', () => {
            expect(isExchangeTrade(exchangeQuote)).toBe(true);
            expect(isBuyTrade(exchangeQuote)).toBe(false);
            expect(isSellFiatTrade(exchangeQuote)).toBe(false);
        });
    });

    describe('isSendRejectedError', () => {
        it('returns true for valid trading send rejected error', () => {
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                        values: { foo: 'bar' },
                    },
                }),
            ).toBe(true);
        });

        it('returns true for valid error without values', () => {
            expect(
                isSendRejectedError({
                    type: 'sign-transaction-timeout',
                    error: {
                        id: 'TR_TIMEOUT',
                    },
                }),
            ).toBe(true);
        });

        it('returns false for invalid shape', () => {
            expect(isSendRejectedError(undefined)).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'invalid-type',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                    },
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 123,
                    },
                }),
            ).toBe(false);
            expect(
                isSendRejectedError({
                    type: 'error',
                    error: {
                        id: 'TR_GENERIC_ERROR',
                        values: 'invalid',
                    },
                }),
            ).toBe(false);
        });
    });
});
