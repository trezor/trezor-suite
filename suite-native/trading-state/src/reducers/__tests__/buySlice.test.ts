import type { CryptoId } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { tradingInitialState } from '@suite-native/trading-consts';
import { buyQuotes, mercuryoApplePayBuyQuote } from '@suite-native/trading-fixtures';
import { type TradingBuyState } from '@suite-native/trading-types';

import { buyActions, buyReducer } from '../buySlice';

describe('buySlice', () => {
    describe('clearState', () => {
        it('should clear buy state', () => {
            const prevState: TradingBuyState = {
                ...tradingInitialState.buy,
                tradingAccountKey: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
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
                tradingAccountKey: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                receiveAccountKey: 'account-key' as AccountKey,
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
