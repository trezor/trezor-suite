import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { buyThunks } from '../../thunks';
import { tradingFixtures } from '../__fixtures__/tradingReducer';
import { initialState, prepareTradingReducer } from '../tradingReducer';

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

    it('buyThunks.handleRequestThunk.rejected should clear quotes, amountLimits and set isLoading to false', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
                        ...initialState,
                        isLoading: true,
                        info: { paymentMethods: [{ value: 'creditCard', label: 'Credit Card' }] },
                        buy: {
                            quotes: [{ id: '1', name: 'Quote 1' }],
                            amountLimits: { min: 0, max: 100 },
                            quotesRequest: { cryptoCurrency: 'bitcoin', fiatCurrency: 'usd' },
                        },
                    },
                },
            },
        });

        store.dispatch({ type: buyThunks.handleRequestThunk.rejected.type });

        expect(store.getState().wallet.tradingNew.buy).toEqual(
            expect.objectContaining({
                isLoading: false,
                quotesRequest: undefined,
                quotes: [],
                amountLimits: undefined,
            }),
        );
        expect(store.getState().wallet.tradingNew.info).toEqual(
            expect.objectContaining({ paymentMethods: [] }),
        );
    });
});
