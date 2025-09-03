import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';

import { exchangeTradingFixtures } from '../__fixtures__/exchangeTradingReducer';
import { tradingExchangeReducer } from '../exchangeReducer';

describe('tradingExchangeReducer', () => {
    exchangeTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            exchange: tradingExchangeReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            exchange: fixture.initialState,
                        },
                    },
                },
            });
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.exchange).toEqual(fixture.result);
        });
    });
});
