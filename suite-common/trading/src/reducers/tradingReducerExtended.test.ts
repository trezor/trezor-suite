import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import { getProviderMetadataFixture } from './__fixtures__/providerMetadata';
import { tradingFixtures } from './__fixtures__/tradingReducer';
import { buyInitialState, tradingBuyActions } from './buyReducer';
import { exchangeInitialState, tradingExchangeActions } from './exchangeReducer';
import { sellInitialState, tradingSellActions } from './sellReducer';
import { initialState, tradingActions } from './tradingCommonReducer';
import { prepareTradingReducer } from './tradingReducer';
import { buyThunks } from '../thunks/buy';
import { exchangeThunks } from '../thunks/exchange';
import { sellThunks } from '../thunks/sell';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

describe('Testing trading reducer', () => {
    tradingFixtures.forEach(f => {
        it(f.description, () => {
            const store = createTestStore({
                extra: undefined,
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

    it('buyThunks.handleRequestThunk.rejected should clear quotes and amountLimits and set isLoading to false', () => {
        const store = createTestStore({
            extra: undefined,
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
                quotesRequest: undefined,
                quotes: [],
                amountLimits: undefined,
                isLoading: false,
            }),
        );
    });

    it('sellThunks.handleRequestThunk.rejected should clear quotes, amountLimits and set isLoading to false', () => {
        const store = createTestStore({
            extra: undefined,
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
    });

    it('exchangeThunks.handleRequestThunk.rejected should clear quotes, amountLimits and set isLoading to false', () => {
        const store = createTestStore({
            extra: undefined,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        exchange: {
                            ...exchangeInitialState,
                            isLoading: true,
                            quotes: [{ orderId: '1' }],
                            amountLimits: { min: 0, max: 100 },
                            quotesRequest: {
                                send: 'bitcoin',
                                receive: 'ethereum',
                                sendStringAmount: '1',
                            },
                        },
                    },
                },
            },
        });

        store.dispatch({ type: exchangeThunks.handleRequestThunk.rejected.type });

        expect(store.getState().wallet.trading.exchange).toEqual(
            expect.objectContaining({
                isLoading: false,
                quotesRequest: undefined,
                quotes: [],
                amountLimits: undefined,
            }),
        );
    });

    it('sellThunks.handleRequestThunk.pending should set isLoading to true', () => {
        const store = createTestStore({
            extra: undefined,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        sell: {
                            ...sellInitialState,
                            isLoading: false,
                        },
                    },
                },
            },
        });

        store.dispatch({ type: sellThunks.handleRequestThunk.pending.type });

        expect(store.getState().wallet.trading.sell).toEqual(
            expect.objectContaining({
                isLoading: true,
            }),
        );
    });

    describe('action delegation', () => {
        let store: ReturnType<
            typeof createTestStore<
                void,
                { wallet: { trading: typeof initialState } },
                UnknownAction
            >
        >;

        beforeEach(() => {
            store = createTestStore({
                extra: undefined,
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
            });
        });

        describe('tradingCommon', () => {
            it('should contain whole trading common state', () => {
                expect(store.getState().wallet.trading).toEqual(initialState);
            });

            it('should delegate common actions to common slice', () => {
                store.dispatch(tradingActions.setModalAccountKey('MY_KEY' as AccountKey)); // Todo: create properly via `createAccountKey()`

                expect(store.getState().wallet.trading.modalAccountKey).toEqual('MY_KEY');
            });

            it('should set currentProviderMetadata with complete provider data', () => {
                const providerMetadata = getProviderMetadataFixture('changenow');
                store.dispatch(tradingActions.setCurrentProviderMetadata(providerMetadata));

                expect(store.getState().wallet.trading.currentProviderMetadata).toEqual(
                    providerMetadata,
                );
            });
        });

        describe('buy', () => {
            it('should contain buy initial state', () => {
                expect(store.getState().wallet.trading.buy).toEqual(buyInitialState);
            });

            it('should delegate buy actions to buy slice', () => {
                store.dispatch(
                    tradingBuyActions.setTradingAccountKey('TRADING_KEY' as AccountKey), // Todo: create properly via `createAccountKey()`
                );
                expect(store.getState().wallet.trading.buy.tradingAccountKey).toEqual(
                    'TRADING_KEY',
                );
            });
        });

        describe('exchange', () => {
            it('should contain exchange initial state', () => {
                expect(store.getState().wallet.trading.exchange).toEqual(exchangeInitialState);
            });

            it('should delegate exchange actions to exchange slice', () => {
                store.dispatch(
                    tradingExchangeActions.setTradingAccountKey('TRADING_KEY' as AccountKey), // Todo: create properly via `createAccountKey()`
                );

                expect(store.getState().wallet.trading.exchange.tradingAccountKey).toEqual(
                    'TRADING_KEY',
                );
            });
        });

        describe('sell', () => {
            it('should contain sell initial state', () => {
                expect(store.getState().wallet.trading.sell).toEqual(sellInitialState);
            });

            it('should delegate sell actions to sell slice', () => {
                store.dispatch(
                    tradingSellActions.setTradingAccountKey('TRADING_KEY' as AccountKey), // Todo: create properly via `createAccountKey()`
                );

                expect(store.getState().wallet.trading.sell.tradingAccountKey).toEqual(
                    'TRADING_KEY',
                );
            });
        });
    });
});
