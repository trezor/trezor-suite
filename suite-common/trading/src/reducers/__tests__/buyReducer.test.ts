import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { buyTradingFixtures } from '../__fixtures__/buyTradingReducer';
import { prepareBuyReducer } from '../buyReducer';

const buyTradingReducer = prepareBuyReducer(extraDependenciesMock);

describe('Testing buy trading reducer', () => {
    buyTradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            buy: buyTradingReducer,
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
