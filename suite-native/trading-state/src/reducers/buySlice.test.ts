import type { CryptoId } from 'invity-api';

import { type TradingBuyState } from '@suite-common/trading';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { tradingInitialState } from '@suite-native/trading-consts';
import {
    btc1NormalAccount,
    buyQuotes,
    eth1NormalAccount,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { buyActions, buyReducer } from './buySlice';

describe('buySlice', () => {
    describe('clearState', () => {
        it('should clear buy state', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                tradingAccountKey: mockAccountKey({ descriptor: 'accountKey' }),
                receiveAddress: 'bc1qxyz',
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
                quotes: buyQuotes,
                selectedQuote: mercuryoApplePayBuyQuote,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
                lastErrorMessage: 'Some error',
            };

            const state = buyReducer(prevState, buyActions.clearState());

            expect(state).toEqual({
                quotes: [],
                isFromRedirect: false,
                isLoading: false,
            });
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
                quotes: buyQuotes,
            };

            const state = buyReducer(prevState, buyActions.clearQuotesAndQuotesRequest());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('assetChanged', () => {
        it('should clear tradingAccountKey, receiveAccountKey and receiveAddress', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                tradingAccountKey: mockAccountKey({ descriptor: 'accountKey' }),
                receiveAccountKey: mockAccountKey({ descriptor: 'accountKey' }),
                receiveAddress: 'bc1qxyz',
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.tradingAccountKey).toBeUndefined();
            expect(state.receiveAccountKey).toBeUndefined();
            expect(state.receiveAddress).toBeUndefined();
        });

        it('should clear buy amountLimits', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                },
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
            };

            const state = buyReducer(prevState, buyActions.assetChanged());

            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('assetTokenChanged', () => {
        it('should clear amount limits and quotes request data without clearing receive account info', () => {
            const tradingAccountKey = btc1NormalAccount.key;
            const receiveAccountKey = eth1NormalAccount.key;
            const receiveAddress = 'bc1qxyz';
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                },
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
                tradingAccountKey,
                receiveAccountKey,
                receiveAddress,
            };

            const state = buyReducer(prevState, buyActions.assetTokenChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
            expect(state.tradingAccountKey).toBe(tradingAccountKey);
            expect(state.receiveAccountKey).toBe(receiveAccountKey);
            expect(state.receiveAddress).toBe(receiveAddress);
        });
    });

    describe('fiatCurrencyChanged', () => {
        it('should clear buy amountLimits', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                    maxCrypto: '0.01',
                    maxFiat: '1000',
                    minCrypto: '0.0001',
                },
            };

            const state = buyReducer(prevState, buyActions.fiatCurrencyChanged());

            expect(state.amountLimits).toBeUndefined();
        });

        it('should clear quotesRequest', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                quotesRequest: {
                    wantCrypto: true,
                    receiveCurrency: 'btc' as CryptoId,
                    fiatCurrency: 'czk',
                    country: 'CZ',
                },
            };

            const state = buyReducer(prevState, buyActions.fiatCurrencyChanged());

            expect(state.quotesRequest).toBeUndefined();
        });
    });
});
