import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';

import { buyTradingFixtures } from './__fixtures__/buyTradingReducer';
import { type TradingBuyState, tradingBuyActions, tradingBuyReducer } from './buyReducer';

type State = { wallet: { trading: { buy: TradingBuyState } } };

describe('tradingBuyReducer', () => {
    buyTradingFixtures.forEach(f => {
        it(f.description, () => {
            const { store } = createTestCompositionRoot<void, State>({
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
            }).services;
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
});
