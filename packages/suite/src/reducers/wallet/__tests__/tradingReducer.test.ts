import { CryptoId, InfoResponse, SellFiatTradeQuoteRequest } from 'invity-api';

import type { TradingTransactionSell } from '@suite-common/trading';

import { STORAGE } from 'src/actions/suite/constants';
import { TRADING_COMMON, TRADING_INFO, TRADING_SELL } from 'src/actions/wallet/constants';
import { sellQuotes } from 'src/reducers/wallet/__fixtures__/tradingReducerFixtures';
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

    it('SAVE_TRADE', () => {
        const tradeSell: TradingTransactionSell = {
            date: 'ddd',
            key: 'exchange-key',
            tradeType: 'sell',
            data: {
                cryptoStringAmount: '1.22',
                fiatStringAmount: '100',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                orderId: 'd369ba9e-7370-4a6e-87dc-aefd3851c735',
                exchange: 'changelly',
                status: 'SEND_CRYPTO',
            },
            account: {
                symbol: 'btc',
                descriptor: 'asdfasdfasdfasdfas',
                accountIndex: 0,
                accountType: 'normal',
            },
            sendAccountKey: 'xxx',
        };

        const updatedTradeSell = {
            ...tradeSell,
            data: { ...tradeSell.data, status: 'REQUESTING' as const },
        };

        expect(
            tradingReducer(
                {
                    ...initialState,
                    trades: [tradeSell],
                },
                {
                    type: TRADING_COMMON.SAVE_TRADE,
                    ...updatedTradeSell,
                },
            ),
        ).toEqual({
            ...initialState,
            trades: [updatedTradeSell],
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
});
