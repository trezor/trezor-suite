import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import { buyTradingFixtures } from '../__fixtures__/buyTradingReducer';
import { tradingBuyReducer } from '../buyReducer';

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
});
