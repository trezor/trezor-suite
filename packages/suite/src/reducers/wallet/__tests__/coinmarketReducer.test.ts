import reducer, { initialState, TradeBuy, TradeExchange } from '@wallet-reducers/coinmarketReducer';
import { STORAGE } from '@suite-actions/constants';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from '@wallet-actions/constants';
import {
    BuyTrade,
    BuyTradeQuoteRequest,
    ExchangeCoinInfo,
    ExchangeTradeQuoteRequest,
} from 'invity-api';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';

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
                addressVerified: '1abcdef',
            } as any),
        ).toEqual({ ...initialState, buy: { ...initialState.buy, addressVerified: '1abcdef' } });
    });

    it('COINMARKET_BUY.DISPOSE', () => {
        expect(
            reducer({ ...initialState, buy: { ...initialState.buy, addressVerified: '1abcdef' } }, {
                type: COINMARKET_BUY.DISPOSE,
            } as any),
        ).toEqual(initialState);
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

    it('COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO', () => {
        const exchangeInfo: ExchangeInfo = {
            providerInfos: {},
            buySymbols: new Set(['btc', 'eth']),
            sellSymbols: new Set(['usd']),
        };
        expect(
            reducer(undefined, {
                type: COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO,
                exchangeInfo,
            } as any),
        ).toEqual({ ...initialState, exchange: { ...initialState.exchange, exchangeInfo } });
    });

    it('COINMARKET_EXCHANGE.SAVE_EXCHANGE_COIN_INFO', () => {
        const exchangeCoinInfo: ExchangeCoinInfo[] = [
            { ticker: 'btc', name: 'bitcoin', category: 'popular' },
        ];
        expect(
            reducer(undefined, {
                type: COINMARKET_EXCHANGE.SAVE_EXCHANGE_COIN_INFO,
                exchangeCoinInfo,
            } as any),
        ).toEqual({ ...initialState, exchange: { ...initialState.exchange, exchangeCoinInfo } });
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
                addressVerified: '2efghi',
            } as any),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, addressVerified: '2efghi' },
        });
    });

    it('SAVE_TRADE', () => {
        const tradeBuy: TradeBuy = {
            date: 'ddd',
            key: 'buy-key',
            tradeType: 'buy',
            data: {
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
            account: {
                symbol: 'btc',
                descriptor: 'asdfasdfasdfasdfas',
                accountIndex: 0,
                accountType: 'normal',
            },
        };
        const tradeExchange: TradeExchange = {
            date: 'ddd',
            key: 'exchange-key',
            tradeType: 'exchange',
            data: {
                sendStringAmount: '47.12',
                send: 'LTC',
                receive: 'BTC',
                receiveStringAmount: '0.004705020432603938',
                orderId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
                exchange: 'changelly',
                status: 'CONFIRMING',
            },
            account: {
                symbol: 'btc',
                descriptor: 'asdfasdfasdfasdfas',
                accountIndex: 0,
                accountType: 'normal',
            },
        };

        const updatedTradeExchange = {
            ...tradeExchange,
            data: { ...tradeExchange.data, statutus: 'CONVERTING' },
        };

        expect(
            reducer(undefined, {
                type: COINMARKET_BUY.SAVE_TRADE,
                ...tradeBuy,
            } as any),
        ).toEqual({
            ...initialState,
            trades: [tradeBuy],
        });

        expect(
            reducer(
                {
                    ...initialState,
                    trades: [tradeExchange, tradeBuy],
                },
                {
                    type: COINMARKET_EXCHANGE.SAVE_TRADE,
                    ...updatedTradeExchange,
                } as any,
            ),
        ).toEqual({
            ...initialState,
            trades: [tradeBuy, updatedTradeExchange],
        });
    });
});
