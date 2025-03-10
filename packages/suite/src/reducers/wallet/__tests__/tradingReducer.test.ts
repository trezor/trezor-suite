import {
    CryptoId,
    ExchangeTradeQuoteRequest,
    InfoResponse,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import type { TradingTransactionExchange } from '@suite-common/trading';

import { STORAGE } from 'src/actions/suite/constants';
import {
    TRADING_COMMON,
    TRADING_EXCHANGE,
    TRADING_INFO,
    TRADING_SELL,
} from 'src/actions/wallet/constants';
import { ExchangeInfo } from 'src/actions/wallet/tradingExchangeActions';
import {
    exchangeQuotes,
    sellQuotes,
} from 'src/reducers/wallet/__fixtures__/tradingReducerFixtures';
import { accounts } from 'src/reducers/wallet/__fixtures__/transactionConstants';
import { initialState, tradingReducer } from 'src/reducers/wallet/tradingReducer';

describe('settings reducer', () => {
    it('test initial state', () => {
        expect(
            tradingReducer(undefined, {
                // @ts-expect-error
                type: 'none',
            }),
        ).toEqual(initialState);
    });

    it('STORAGE.LOAD', () => {
        expect(
            tradingReducer(undefined, {
                type: STORAGE.LOAD,
                payload: {
                    tradingTrades: initialState.trades,
                },
            } as any),
        ).toEqual(initialState);
    });

    it('TRADING_COMMON.SET_MODAL_ACCOUNT', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_COMMON.SET_MODAL_ACCOUNT_KEY,
                modalAccountKey: accounts[0].key,
            }),
        ).toEqual({
            ...initialState,
            modalAccountKey: accounts[0].key,
        });

        expect(
            tradingReducer(undefined, {
                type: TRADING_COMMON.SET_MODAL_ACCOUNT_KEY,
                modalAccountKey: undefined,
            }),
        ).toEqual({
            ...initialState,
            modalAccountKey: undefined,
        });
    });

    it('TRADING_COMMON.SET_MODAL_CRYPTO_CURRENCY', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_COMMON.SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoId: 'ankr' as CryptoId,
            }),
        ).toEqual({
            ...initialState,
            modalCryptoId: 'ankr',
        });

        expect(
            tradingReducer(undefined, {
                type: TRADING_COMMON.SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoId: undefined,
            }),
        ).toEqual({
            ...initialState,
            modalCryptoId: undefined,
        });
    });

    it('TRADING_COMMON.SET_TRADING_ACTIVE_SECTION', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_COMMON.SET_TRADING_ACTIVE_SECTION,
                activeSection: 'exchange',
            }),
        ).toEqual({
            ...initialState,
            activeSection: 'exchange',
        });
    });

    it('TRADING_INFO.SAVE_SYMBOLS_INFO', () => {
        const info: InfoResponse = {
            platforms: {
                ethereum: {
                    id: 'ethereum',
                    name: 'Ethereum',
                    nativeCoinSymbol: 'eth',
                },
            },
            coins: {
                ethereum: {
                    coingeckoId: 'ethereum',
                    symbol: 'ETH',
                    name: 'Ethereum',
                    services: {
                        buy: true,
                        sell: true,
                        exchange: true,
                    },
                },
            },
        };
        expect(
            tradingReducer(undefined, {
                type: TRADING_INFO.SAVE_INFO,
                info,
            }),
        ).toEqual({ ...initialState, info: { ...initialState.info, ...info } });
    });

    it('TRADING_SELL.SELL_QUOTES', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SAVE_QUOTES,
                quotes: sellQuotes,
            }),
        ).toEqual({
            ...initialState,
            sell: { ...initialState.sell, quotes: sellQuotes },
        });
    });

    it('TRADING_EXCHANGE.EXCHANGE_QUOTES', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.SAVE_QUOTES,
                quotes: exchangeQuotes,
            }),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, quotes: exchangeQuotes },
        });
    });

    it('TRADING_EXCHANGE.SAVE_EXCHANGE_INFO', () => {
        const exchangeInfo: ExchangeInfo = {
            providerInfos: {},
            buySymbols: new Set(['BTC', 'ETH']) as Set<CryptoId>,
            sellSymbols: new Set(['USDT@ETH']) as Set<CryptoId>,
        };
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.SAVE_EXCHANGE_INFO,
                exchangeInfo,
            }),
        ).toEqual({ ...initialState, exchange: { ...initialState.exchange, exchangeInfo } });
    });

    it('TRADING_EXCHANGE.SAVE_QUOTE_REQUEST', () => {
        const request: ExchangeTradeQuoteRequest = {
            receive: 'BTC' as CryptoId,
            send: 'LTC' as CryptoId,
            sendStringAmount: '1',
        };
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.SAVE_QUOTE_REQUEST,
                request,
            }),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, quotesRequest: request },
        });
    });

    it('TRADING_EXCHANGE.VERIFY_ADDRESS', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.VERIFY_ADDRESS,
                addressVerified: '2efghi',
            }),
        ).toEqual({
            ...initialState,
            exchange: { ...initialState.exchange, addressVerified: '2efghi' },
        });
    });

    it('SAVE_TRADE', () => {
        const tradeExchange: TradingTransactionExchange = {
            date: 'ddd',
            key: 'exchange-key',
            tradeType: 'exchange',
            data: {
                sendStringAmount: '47.12',
                send: 'LTC' as CryptoId,
                receive: 'BTC' as CryptoId,
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
            tradingReducer(
                {
                    ...initialState,
                    trades: [tradeExchange],
                },
                {
                    type: TRADING_COMMON.SAVE_TRADE,
                    ...updatedTradeExchange,
                },
            ),
        ).toEqual({
            ...initialState,
            trades: [updatedTradeExchange],
        });
    });

    it('TRADING_SELL.SET_IS_FROM_REDIRECT', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SET_IS_FROM_REDIRECT,
                isFromRedirect: true,
            }),
        ).toEqual({ ...initialState, sell: { ...initialState.sell, isFromRedirect: true } });
    });

    it('TRADING_SELL.SAVE_TRANSACTION_ID', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SAVE_TRANSACTION_ID,
                transactionId: '1234-1234-1234',
            }),
        ).toEqual({
            ...initialState,
            sell: { ...initialState.sell, transactionId: '1234-1234-1234' },
        });
    });

    it('TRADING_SELL.SAVE_QUOTE_REQUEST', () => {
        const request: SellFiatTradeQuoteRequest = {
            amountInCrypto: true,
            cryptoCurrency: 'BTC' as CryptoId,
            fiatCurrency: 'EUR',
            cryptoStringAmount: '1',
        };
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SAVE_QUOTE_REQUEST,
                request,
            }),
        ).toEqual({
            ...initialState,
            sell: { ...initialState.sell, quotesRequest: request },
        });
    });

    it('TRADING_SELL.SAVE_QUOTE', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SAVE_QUOTE,
                quote: sellQuotes[0],
            }),
        ).toEqual({
            ...initialState,
            sell: {
                ...initialState.sell,
                selectedQuote: sellQuotes[0],
            },
        });
    });

    it('TRADING_EXCHANGE.SAVE_QUOTE', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.SAVE_QUOTE,
                quote: exchangeQuotes[0],
            }),
        ).toEqual({
            ...initialState,
            exchange: {
                ...initialState.exchange,
                selectedQuote: exchangeQuotes[0],
            },
        });
    });

    it('TRADING_SELL.SET_TRADING_ACCOUNT', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_SELL.SET_TRADING_ACCOUNT_KEY,
                accountKey: accounts[0].key,
            }),
        ).toEqual({
            ...initialState,
            sell: {
                ...initialState.sell,
                tradingAccountKey: accounts[0].key,
            },
        });
    });

    it('TRADING_EXCHANGE.SET_TRADING_ACCOUNT', () => {
        expect(
            tradingReducer(undefined, {
                type: TRADING_EXCHANGE.SET_TRADING_ACCOUNT_KEY,
                accountKey: accounts[0].key,
            }),
        ).toEqual({
            ...initialState,
            exchange: {
                ...initialState.exchange,
                tradingAccountKey: accounts[0].key,
            },
        });
    });
});
