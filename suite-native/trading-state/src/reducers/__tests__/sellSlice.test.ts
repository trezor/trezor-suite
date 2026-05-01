import type { CryptoId } from 'invity-api';

import { type TradingSellState } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { tradingInitialState } from '@suite-native/trading-consts';
import { banxaCreditCardSellQuote, sellQuotes } from '@suite-native/trading-fixtures';

import { sellActions, sellReducer } from '../sellSlice';

describe('sellSlice', () => {
    describe('clearState', () => {
        it('should clear the state', () => {
            const prevState: TradingSellState = {
                ...tradingInitialState.sell,
                tradingAccountKey: 'account-key' as AccountKey, // Todo: create properly via `createAccountKey()`
                quotesRequest: {
                    fiatCurrency: 'czk',
                    country: 'CZ',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    amountInCrypto: true,
                },
                quotes: sellQuotes,
                selectedQuote: banxaCreditCardSellQuote,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
                lastErrorMessage: 'Some error',
            };

            const state = sellReducer(prevState, sellActions.clearState());

            expect(state).toEqual(tradingInitialState.sell);
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingSellState = {
                ...tradingInitialState.sell,
                quotesRequest: {
                    fiatCurrency: 'czk',
                    country: 'CZ',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    amountInCrypto: true,
                },
                quotes: sellQuotes,
            };

            const state = sellReducer(prevState, sellActions.clearQuotesAndQuotesRequest());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('sendAssetChanged', () => {
        it('should clear amount limits and quotes request data', () => {
            const prevState: TradingSellState = {
                ...tradingInitialState.sell,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
                quotesRequest: {
                    fiatCurrency: 'czk',
                    country: 'CZ',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    amountInCrypto: true,
                },
            };

            const state = sellReducer(prevState, sellActions.sendAssetChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
        });
    });

    describe('fiatCurrencyChanged', () => {
        it('should clear amount limits and quotes request data', () => {
            const prevState: TradingSellState = {
                ...tradingInitialState.sell,
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
                quotesRequest: {
                    fiatCurrency: 'czk',
                    country: 'CZ',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    amountInCrypto: true,
                },
            };

            const state = sellReducer(prevState, sellActions.fiatCurrencyChanged());

            expect(state.amountLimits).toBeUndefined();
            expect(state.quotesRequest).toBeUndefined();
        });
    });
});
