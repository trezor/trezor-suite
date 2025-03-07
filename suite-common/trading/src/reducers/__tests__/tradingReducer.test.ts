import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { tradingFixtures } from '../__fixtures__/tradingReducer';
import { prepareTradingReducer } from '../tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('Testing trading reducer', () => {
    tradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        tradingNew: tradingReducer,
                    }),
                }),
                preloadedState: { wallet: { tradingNew: f.initialState } },
            });
            f.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.tradingNew).toEqual(f.result);
        });
    });
});
