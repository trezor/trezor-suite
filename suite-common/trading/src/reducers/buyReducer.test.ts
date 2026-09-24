import { combineReducers } from '@reduxjs/toolkit';
import { type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';

import { createTestStore } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import { mercuryoApplePayQuote } from '../__fixtures__/buyUtils';
import { buyTradingFixtures } from './__fixtures__/buyTradingReducer';
import { buyInitialState, tradingBuyActions, tradingBuyReducer } from './buyReducer';

describe('tradingBuyReducer', () => {
    buyTradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = createTestStore({
                extra: undefined,
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            buy: tradingBuyReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            buy: f.initialState,
                        },
                    },
                },
            });
            f.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.buy).toEqual(f.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingBuyReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingBuyReducer(
                undefined,
                tradingBuyActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });
    describe('clearQuotesAndParams', () => {
        it('should clear quotes, quotesRequest, selectedQuote, and amountLimits', () => {
            const state = tradingBuyReducer(undefined, tradingBuyActions.clearQuotesAndParams());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
            expect(state.amountLimits).toBeUndefined();
        });
    });

    describe('setTradingAccountKey', () => {
        const KEY_1 = 'account-1' as AccountKey;
        const QUOTES_REQUEST: BuyTradeQuoteRequest = {
            wantCrypto: false,
            fiatCurrency: 'EUR',
            receiveCurrency: 'bitcoin' as CryptoId,
            fiatStringAmount: '10',
            country: 'CZ',
        };
        const withQuotes = () =>
            [
                tradingBuyActions.setTradingAccountKey(KEY_1),
                tradingBuyActions.saveQuoteRequest(QUOTES_REQUEST),
                tradingBuyActions.saveQuotes([mercuryoApplePayQuote]),
                tradingBuyActions.saveSelectedQuote(mercuryoApplePayQuote),
            ].reduce(tradingBuyReducer, buyInitialState);

        it('clears quotes, quotesRequest and selectedQuote when the account key is cleared', () => {
            const state = tradingBuyReducer(
                withQuotes(),
                tradingBuyActions.setTradingAccountKey(undefined),
            );

            expect(state.tradingAccountKey).toBeUndefined();
            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
        });
    });
});
