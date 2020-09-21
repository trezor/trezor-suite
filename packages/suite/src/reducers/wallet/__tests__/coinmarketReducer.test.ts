import reducer, { initialState } from '@wallet-reducers/coinmarketReducer';
import { STORAGE } from '@suite-actions/constants';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from '@wallet-actions/constants';
import { BuyTrade, BuyTradeQuoteRequest, ExchangeTradeQuoteRequest } from 'invity-api';
import { BuyInfo } from '@suite/actions/wallet/coinmarketBuyActions';

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            reducer(undefined, {
                // @ts-ignore
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOADED', () => {
        expect(
            reducer(undefined, {
                type: STORAGE.LOADED,
                payload: {
                    wallet: {
                        settings: initialState,
                    },
                },
            } as any),
        ).toEqual(initialState);
    });

    it('COINMARKET_BUY.SAVE_BUY_INFO', () => {
        const buyInfo: BuyInfo = {
            providerInfos: {},
            supportedCryptoCurrencies: new Set(['btc', 'eth']),
            supportedFiatCurrencies: new Set(['usd']),
        };
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_BUY_INFO,
                buyInfo,
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, buyInfo } });
    });

    it('COINMARKET_BUY.SET_IS_FROM_REDIRECT', () => {
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SET_IS_FROM_REDIRECT,
                isFromRedirect: true,
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, isFromRedirect: true } });
    });

    it('COINMARKET_BUY.SAVE_QUOTE_REQUEST', () => {
        const request: BuyTradeQuoteRequest = {
            fiatCurrency: 'EUR',
            receiveCurrency: 'BTC',
            wantCrypto: false,
            country: 'CZ',
            fiatStringAmount: '1',
        };
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_QUOTE_REQUEST,
                request,
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, quotesRequest: request } });
    });

    it('COINMARKET_BUY.SAVE_TRANSACTION_DETAIL_ID', () => {
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_TRANSACTION_DETAIL_ID,
                transactionId: '1234-1234-1234',
            } as any),
        ).toEqual({
            ...initialState,
            buy: { ...initialState.buy, transactionId: '1234-1234-1234' },
        });
    });

    it('COINMARKET_BUY.SAVE_QUOTES', () => {
        const quotes: BuyTrade[] = [
            {
                fiatStringAmount: '47.12',
                fiatCurrency: 'EUR',
                receiveCurrency: 'BTC',
                receiveStringAmount: '0.004705020432603938',
                rate: 10014.834297738,
                quoteId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
                exchange: 'mercuryo',
                minFiat: 20.03,
                maxFiat: 2000.05,
                minCrypto: 0.002,
                maxCrypto: 0.19952,
                paymentMethod: 'creditCard',
            },
            {
                fiatStringAmount: '47.12',
                fiatCurrency: 'EUR',
                receiveCurrency: 'BTC',
                receiveStringAmount: '0.0041',
                rate: 11492.682926829268,
                quoteId: '53233267-8181-4151-9a67-9d8efc9a15db',
                exchange: 'cexdirect',
                minFiat: 25,
                maxFiat: 1000,
                minCrypto: 0.002,
                maxCrypto: 0.1055,
                paymentMethod: 'creditCard',
            },
        ];
        const alternativeQuotes: BuyTrade[] = [];
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_QUOTES,
                quotes,
                alternativeQuotes,
            } as any),
        ).toEqual({
            ...initialState,
            buy: { ...initialState.buy, quotes, alternativeQuotes },
        });
    });

    it('COINMARKET_BUY.VERIFY_ADDRESS', () => {
        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.VERIFY_ADDRESS,
                addressVerified: true,
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, addressVerified: true } });
    });

    it('COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO', () => {
        const cachedAccountInfo = {
            symbol: 'btc',
            index: 1,
            accountType: 'segwit',
            shouldSubmit: true,
        };

        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO,
                ...cachedAccountInfo,
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, cachedAccountInfo } });
    });

    it('COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST', () => {
        const request: ExchangeTradeQuoteRequest = {
            receive: 'BTC',
            send: 'LTC',
            sendStringAmount: '1',
        };
        expect(
            reducer(undefined, {
                type: COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST,
                request,
            } as any),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, quotesRequest: request },
        });
    });

    it('COINMARKET_EXCHANGE.VERIFY_ADDRESS', () => {
        expect(
            reducer(undefined, {
                type: COINMARKET_EXCHANGE.VERIFY_ADDRESS,
                addressVerified: true,
            } as any),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, addressVerified: true },
        });
    });
});
