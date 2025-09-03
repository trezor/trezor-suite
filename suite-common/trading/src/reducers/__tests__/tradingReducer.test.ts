import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { selectTradingMaxSlippagePercentage } from '../../selectors/settingsSelectors';
import { buyThunks, sellThunks } from '../../thunks';
import { tradingFixtures } from '../__fixtures__/tradingReducer';
import { settingsInitialState, tradingSettingsActions } from '../settingsReducer';
import { initialState, prepareTradingReducer } from '../tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('Testing trading reducer', () => {
    tradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
                preloadedState: { wallet: { trading: f.initialState } },
            });
            f.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading).toEqual(f.result);
        });
    });

    it('buyThunks.handleRequestThunk.rejected should clear quotes, amountLimits and set isLoading to false', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
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

        expect(store.getState().wallet.trading.buy).toEqual(
            expect.objectContaining({
                isLoading: false,
                quotesRequest: undefined,
                quotes: [],
                amountLimits: undefined,
            }),
        );
        expect(store.getState().wallet.trading.info).toEqual(
            expect.objectContaining({ paymentMethods: [] }),
        );
    });

    it('sellThunks.handleRequestThunk.rejected should clear quotes, amountLimits and set isLoading to false', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        isLoading: true,
                        info: { paymentMethods: [{ value: 'creditCard', label: 'Credit Card' }] },
                        sell: {
                            quotes: [{ id: '1', name: 'Quote 1' }],
                            amountLimits: { min: 0, max: 100 },
                            quotesRequest: { cryptoCurrency: 'bitcoin', fiatCurrency: 'usd' },
                        },
                    },
                },
            },
        });

        store.dispatch({ type: sellThunks.handleRequestThunk.rejected.type });

        expect(store.getState().wallet.trading.sell).toEqual(
            expect.objectContaining({
                isLoading: false,
                quotesRequest: undefined,
                quotes: [],
                amountLimits: undefined,
            }),
        );
        expect(store.getState().wallet.trading.info).toEqual(
            expect.objectContaining({ paymentMethods: [] }),
        );
    });

    describe('tradingSettings', () => {
        it('should contain settings initial state', () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
            });

            expect(store.getState().wallet.trading.settings).toEqual(settingsInitialState);
        });

        it('should delegate settings actions to settings slice', () => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
            });

            store.dispatch(tradingSettingsActions.setMaxSlippagePercentage('2'));

            expect(selectTradingMaxSlippagePercentage(store.getState())).toEqual('2');
        });
    });
});
