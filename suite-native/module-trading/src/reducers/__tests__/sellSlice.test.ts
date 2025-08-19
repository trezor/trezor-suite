import { CryptoId } from 'invity-api';

import { sellQuotes } from '../../__fixtures__/sellQuotes';
import { TradingSellState, sellActions, sellInitialState, sellReducer } from '../sellSlice';

describe('sellSlice', () => {
    describe('clearState', () => {
        it('should clear the state', () => {
            const prevState: TradingSellState = {
                ...sellInitialState,
                tradingAccountKey: 'account-key',
                quotesRequest: {
                    fiatCurrency: 'czk',
                    country: 'CZ',
                    cryptoCurrency: 'bitcoin' as CryptoId,
                    amountInCrypto: true,
                },
                quotes: sellQuotes,
                selectedQuote: sellQuotes[0],
                amountLimits: {
                    currency: 'CZK',
                    minFiat: '100',
                },
            };

            const state = sellReducer(prevState, sellActions.clearState());

            expect(state).toEqual(sellInitialState);
        });
    });

    describe('clearQuotesAndQuotesRequest', () => {
        it('should clear quotes and quotesRequest', () => {
            const prevState: TradingSellState = {
                ...sellInitialState,
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
});
