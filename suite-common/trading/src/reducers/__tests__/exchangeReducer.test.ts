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
                        tradingNew: combineReducers({
                            exchange: tradingExchangeReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        tradingNew: {
                            exchange: fixture.initialState,
                        },
                    },
                },
            });
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.tradingNew.exchange).toEqual(fixture.result);
        });
    });
});
