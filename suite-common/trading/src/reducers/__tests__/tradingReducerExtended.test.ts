import { combineReducers } from '@reduxjs/toolkit';
import type { CryptoId } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import { selectTradingMaxSlippagePercentage } from '../../selectors/settingsSelectors';
import { buyThunks } from '../../thunks/buy';
import { sellThunks } from '../../thunks/sell';
import { getProviderMetadataFixture } from '../__fixtures__/providerMetadata';
import { tradingFixtures } from '../__fixtures__/tradingReducer';
import { buyInitialState, tradingBuyActions } from '../buyReducer';
import { exchangeInitialState, tradingExchangeActions } from '../exchangeReducer';
import { sellInitialState, tradingSellActions } from '../sellReducer';
import { settingsInitialState, tradingSettingsActions } from '../settingsReducer';
import { initialState, tradingActions } from '../tradingCommonReducer';
import { prepareTradingReducer } from '../tradingReducer';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

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

    it('buyThunks.handleRequestThunk.rejected should clear quotes and amountLimits', () => {
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

    it('sellThunks.handleRequestThunk.pending should clear payment methods and set isLoading to true', () => {
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
                        info: { paymentMethods: [{ value: 'creditCard', label: 'Credit Card' }] },
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
        expect(store.getState().wallet.trading.info).toEqual(
            expect.objectContaining({ paymentMethods: [] }),
        );
    });

    describe('action delegation', () => {
        let store: ReturnType<
            typeof configureMockStore<{ wallet: { trading: typeof initialState } }>
        >;

        beforeEach(() => {
            store = configureMockStore({
                extra: {},
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

            it('should initialize favouriteAssets for legacy state before adding favourites', () => {
                const legacyStore = configureMockStore({
                    extra: {},
                    reducer: combineReducers({
                        wallet: combineReducers({
                            trading: tradingReducer,
                        }),
                    }),
                    preloadedState: {
                        wallet: {
                            trading: { ...initialState, favouriteAssets: undefined },
                        },
                    },
                });

                legacyStore.dispatch(
                    tradingActions.addTradeableAssetToFavourites('bitcoin' as CryptoId),
                );

                expect(legacyStore.getState().wallet.trading.favouriteAssets).toEqual({
                    bitcoin: true,
                });
            });
        });

        describe('tradingSettings', () => {
            it('should contain settings initial state', () => {
                expect(store.getState().wallet.trading.settings).toEqual(settingsInitialState);
            });

            it('should delegate settings actions to settings slice', () => {
                store.dispatch(tradingSettingsActions.setMaxSlippagePercentage('2'));

                expect(selectTradingMaxSlippagePercentage(store.getState())).toEqual('2');
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
