import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import { sellTradingFixtures } from '../__fixtures__/sellTradingReducer';
import { tradingSellReducer } from '../sellReducer';

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
});
