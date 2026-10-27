import { combineReducers } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { getProviderMetadataFixture } from './__fixtures__/providerMetadata';
import { tradingFixtures } from './__fixtures__/tradingReducer';
import { buyInitialState, tradingBuyActions } from './buyReducer';
import { exchangeInitialState, tradingExchangeActions } from './exchangeReducer';
import { sellInitialState, tradingSellActions } from './sellReducer';
import {
    type TradingRootState,
    type TradingState,
    initialState,
    tradingActions,
} from './tradingCommonReducer';
import { prepareTradingReducer } from './tradingReducer';
import { buyThunks } from '../thunks/buy';
import { exchangeThunks } from '../thunks/exchange';
import { sellThunks } from '../thunks/sell';
import { type TradingAmountLimitProps, type TradingType } from '../types';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const sectionActions = {
    buy: tradingBuyActions,
    sell: tradingSellActions,
    exchange: tradingExchangeActions,
} satisfies Record<TradingType, unknown>;

describe('Testing trading reducer', () => {
    tradingFixtures.forEach(f => {
        it(f.description, () => {
            const { store } = createTestCompositionRoot<void, TradingRootState>({
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
                preloadedState: { wallet: { trading: f.initialState } },
            }).services;
            f.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading).toEqual(f.result);
        });
    });

    it('buyThunks.handleRequestThunk.rejected should clear quotes and amountLimits and set isLoading to false', () => {
        const { store } = createTestCompositionRoot<void, TradingRootState>({
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
        }).services;

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
        const { store } = createTestCompositionRoot<void, TradingRootState>({
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
        }).services;

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
        const { store } = createTestCompositionRoot<void, TradingRootState>({
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
        }).services;

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
        const { store } = createTestCompositionRoot<void, TradingRootState>({
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
        }).services;

        store.dispatch({ type: sellThunks.handleRequestThunk.pending.type });

        expect(store.getState().wallet.trading.sell).toEqual(
            expect.objectContaining({
                isLoading: true,
            }),
        );
    });

    describe('action delegation', () => {
        const initStore = () =>
            createTestCompositionRoot<void, TradingRootState>({
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
            }).services.store;

        let store: TestCompositionStore<TradingRootState, void>;

        beforeEach(() => {
            store = initStore();
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

            describe('bindTradingAccount', () => {
                const previousAccountKey = mockAccountKey({ descriptor: 'previousaccount' });
                const hostAccountKey = mockAccountKey({ descriptor: 'hostaccount' });
                const amountLimits: TradingAmountLimitProps = { currency: 'BTC' };

                const fillSection = (type: TradingType, accountKey: AccountKey) => {
                    store.dispatch(sectionActions[type].setTradingAccountKey(accountKey));
                    store.dispatch(sectionActions[type].setAmountLimits(amountLimits));
                    store.dispatch(sectionActions[type].saveTransactionId('stale-order'));
                };

                it.each<TradingType>(['buy', 'sell', 'exchange'])(
                    'binds the %s section to another account and drops the previous form state',
                    type => {
                        fillSection(type, previousAccountKey);

                        store.dispatch(
                            tradingActions.bindTradingAccount({ type, accountKey: hostAccountKey }),
                        );

                        expect(store.getState().wallet.trading.activeSection).toBe(type);
                        expect(store.getState().wallet.trading[type]).toEqual(
                            expect.objectContaining({
                                tradingAccountKey: hostAccountKey,
                                transactionId: undefined,
                                amountLimits: undefined,
                            }),
                        );
                    },
                );

                it('binds the buy receive account as well', () => {
                    store.dispatch(
                        tradingActions.bindTradingAccount({
                            type: 'buy',
                            accountKey: hostAccountKey,
                        }),
                    );

                    expect(store.getState().wallet.trading.buy.receiveAccountKey).toBe(
                        hostAccountKey,
                    );
                });

                it('keeps the form state when the same account is bound again', () => {
                    fillSection('sell', hostAccountKey);

                    store.dispatch(
                        tradingActions.bindTradingAccount({
                            type: 'sell',
                            accountKey: hostAccountKey,
                        }),
                    );

                    expect(store.getState().wallet.trading.sell).toEqual(
                        expect.objectContaining({
                            transactionId: undefined,
                            amountLimits,
                        }),
                    );
                });
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

    describe('trade API salts', () => {
        const staticSessionId = 'device-id@wallet-id:0' as StaticSessionId;
        const otherStaticSessionId = 'device-id@wallet-id:1' as StaticSessionId;
        const device = mockSuiteDevice({ state: { staticSessionId } });
        const salt = 'aa'.repeat(32);
        const otherSalt = 'cc'.repeat(32);

        const withSalts = (salts: Partial<TradingState>): TradingState => ({
            ...initialState,
            ...salts,
        });

        it.each([
            { isRemembered: true, expected: { tradeApiSalts: { [staticSessionId]: salt } } },
            {
                isRemembered: false,
                expected: { tradeApiSessionSalts: { [staticSessionId]: salt } },
            },
        ])(
            'stores a device salt with isRemembered=$isRemembered in its bucket',
            ({ isRemembered, expected }) => {
                const state = tradingReducer(
                    initialState,
                    tradingActions.setTradeApiDeviceSalt({ staticSessionId, salt, isRemembered }),
                );

                expect(state).toEqual(withSalts(expected));
            },
        );

        it.each([
            {
                remember: true,
                before: { tradeApiSessionSalts: { [staticSessionId]: salt } },
                after: { tradeApiSalts: { [staticSessionId]: salt } },
            },
            {
                remember: false,
                before: { tradeApiSalts: { [staticSessionId]: salt } },
                after: { tradeApiSessionSalts: { [staticSessionId]: salt } },
            },
        ])(
            'moves the wallet salt to the matching bucket when remember=$remember',
            ({ remember, before, after }) => {
                const state = tradingReducer(
                    withSalts(before),
                    deviceActions.setRememberDevice({ device, remember }),
                );

                expect(state).toEqual(withSalts(after));
            },
        );

        it('removes only the forgotten wallet salt from both buckets', () => {
            const state = tradingReducer(
                withSalts({
                    tradeApiSalts: { [staticSessionId]: salt, [otherStaticSessionId]: otherSalt },
                    tradeApiSessionSalts: { [staticSessionId]: salt },
                    tradeApiInstallSalt: otherSalt,
                }),
                deviceActions.forgetDevice({ device }),
            );

            expect(state).toEqual(
                withSalts({
                    tradeApiSalts: { [otherStaticSessionId]: otherSalt },
                    tradeApiInstallSalt: otherSalt,
                }),
            );
        });

        it('loads stored salts, preferring the stored install salt', () => {
            const state = tradingReducer(withSalts({ tradeApiInstallSalt: otherSalt }), {
                type: mockActionType('storageLoad'),
                payload: {
                    tradeApiSalts: [{ key: staticSessionId, value: salt }],
                    tradeApiInstallSalt: salt,
                },
            });

            expect(state).toEqual(
                withSalts({
                    tradeApiSalts: { [staticSessionId]: salt },
                    tradeApiInstallSalt: salt,
                }),
            );
        });
    });
});
