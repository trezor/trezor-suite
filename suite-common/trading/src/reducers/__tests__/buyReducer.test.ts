import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import { buyTradingFixtures } from '../__fixtures__/buyTradingReducer';
import { tradingBuyActions, tradingBuyReducer } from '../buyReducer';

describe('tradingBuyReducer', () => {
    buyTradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = configureMockStore({
                extra: {},
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
        it('should clear quotes, quotesRequest, selectedQuote, preselectedQuote, and amountLimits', () => {
            const state = tradingBuyReducer(undefined, tradingBuyActions.clearQuotesAndParams());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
            expect(state.preselectedQuote).toBeUndefined();
            expect(state.amountLimits).toBeUndefined();
        });
    });
});
