import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import { sellTradingFixtures } from '../__fixtures__/sellTradingReducer';
import { tradingSellActions, tradingSellReducer } from '../sellReducer';

describe('tradingSellReducer', () => {
    sellTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            sell: tradingSellReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            sell: fixture.initialState,
                        },
                    },
                },
            });
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.sell).toEqual(fixture.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingSellReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingSellReducer(
                undefined,
                tradingSellActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });
    describe('clearQuotesAndParams', () => {
        it('should clear quotes, quotesRequest, selectedQuote, and amountLimits', () => {
            const state = tradingSellReducer(undefined, tradingSellActions.clearQuotesAndParams());

            expect(state.quotes).toEqual([]);
            expect(state.quotesRequest).toBeUndefined();
            expect(state.selectedQuote).toBeUndefined();
            expect(state.amountLimits).toBeUndefined();
        });
    });
});
