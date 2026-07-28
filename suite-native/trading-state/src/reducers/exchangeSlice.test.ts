import type { CryptoId } from 'invity-api';

import { type TradingExchangeState } from '@suite-common/trading';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { tradingInitialState } from '@suite-native/trading-consts';
import {
    eth1NormalAccount,
    exchangeQuotes,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { exchangeActions, exchangeReducer } from './exchangeSlice';

describe('exchangeSlice', () => {
    it('should have correct initial state', () => {
        const state = exchangeReducer(undefined, { type: 'unknown_action' });

        expect(state).toEqual({
            quotes: [],
            isFromRedirect: false,
            isLoading: false,
            formStep: 'RECEIVING_ADDRESS',
        });
    });

    describe('clearState', () => {
        it('should clear exchange state', () => {
            const prevState: TradingExchangeState = {
                ...tradingInitialState.exchange,
                receiveAddress: 'bc1qxyz',
                tradingAccountKey: mockAccountKey({ descriptor: 'accountKey1' }),
                receiveAccountKey: mockAccountKey({ descriptor: 'accountKey2' }),
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                quotes: exchangeQuotes,
                selectedQuote: mercuryoFixedWorstQuote,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                lastErrorMessage: 'Some error',
            };

            const state = exchangeReducer(prevState, exchangeActions.clearState());

            expect(state).toEqual({
                quotes: [],
                formStep: 'RECEIVING_ADDRESS',
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingExchangeState = {
                ...tradingInitialState.exchange,
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                quotes: exchangeQuotes,
            };

            const state = exchangeReducer(prevState, exchangeActions.clearQuotesAndQuotesRequest());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('sendAssetChanged', () => {
        it('should clear amount limits and quotes request data', () => {
            const prevState: TradingExchangeState = {
                ...tradingInitialState.exchange,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
            };

            const state = exchangeReducer(prevState, exchangeActions.sendAssetChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('receiveAssetChanged', () => {
        it('should clear amount limits, quotes request and receive account info', () => {
            const prevState: TradingExchangeState = {
                ...tradingInitialState.exchange,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                receiveAccountKey: mockAccountKey({ descriptor: 'accountKey1' }),
                receiveAddress: 'bc1qxyz',
            };

            const state = exchangeReducer(prevState, exchangeActions.receiveAssetChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
            expect(state.receiveAccountKey).toBeUndefined();
            expect(state.receiveAddress).toBeUndefined();
        });
    });

    describe('receiveTokenChanged', () => {
        it('should clear amount limits and quotes request data without clearing receive account info', () => {
            const receiveAccountKey = eth1NormalAccount.key;
            const receiveAddress = 'bc1qxyz';
            const prevState: TradingExchangeState = {
                ...tradingInitialState.exchange,
                amountLimits: {
                    currency: 'BTC',
                    minCrypto: '0.001',
                    maxCrypto: '10',
                },
                quotesRequest: {
                    send: 'bitcoin' as CryptoId,
                    receive: 'ethereum' as CryptoId,
                },
                receiveAccountKey,
                receiveAddress,
            };

            const state = exchangeReducer(prevState, exchangeActions.receiveTokenChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
            expect(state.receiveAccountKey).toBe(receiveAccountKey);
            expect(state.receiveAddress).toBe(receiveAddress);
        });
    });
});
