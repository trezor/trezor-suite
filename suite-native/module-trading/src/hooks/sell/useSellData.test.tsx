import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tradingSellActions, tradingThunks } from '@suite-common/trading';
import { mockGetSelectedAccount, mockGetTradingEnvironment } from '@suite-common/trading/mocks';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { tradingSlice } from '@suite-native/trading-state';

import { useSellData } from './useSellData';

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount2') });
const btc3Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount3') });

describe('useSellData', () => {
    const extra = {
        services: {
            getSelectedAccount: mockGetSelectedAccount(),
            getTradingEnvironment: mockGetTradingEnvironment(),
        },
    };

    const accounts = [
        btc1Account,
        btc2Account,
        { ...btc3Account, descriptor: asAccountDescriptor('') },
    ];

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(accounts),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const getInitializedStore = (tradingAccountKey: AccountKey | undefined) => {
        const tradingState = getInitializedTradingState('sell');
        tradingState.sell!.tradingAccountKey = tradingAccountKey;

        return createTestCompositionRoot({
            extra,
            reducer,
            preloadedState: {
                wallet: {
                    trading: tradingState,
                },
            },
        }).store;
    };

    const getDefaultStore = () => createTestCompositionRoot({ extra, reducer }).store;

    const renderUseSellData = async (store?: TestStore) => {
        const ret = await renderHookWithStoreProvider(useSellData, {
            store: store ?? getDefaultStore(),
        });

        await act(() => Promise.resolve()); // Wait for all effects to run

        return ret;
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve({}),
                ok: true,
            }),
        );
    });

    it('should have isLoading with value true on 1st call', async () => {
        global.fetch = jest.fn().mockImplementation(
            () =>
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            json: () => Promise.resolve({}),
                            ok: true,
                        });
                    }, 100);
                }),
        );
        const { result } = await renderUseSellData();

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const { result } = await renderUseSellData();

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { rerender } = await renderUseSellData();
        await rerender({});

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should force reload on refetch and respect the cache on subsequent account changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { store } = createTestCompositionRoot({ extra, reducer });
        const { result } = await renderUseSellData(store);
        await act(async () => {
            await result.current.refetch();
        });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(2);
        expect(initialThunkLoadActionSpy).toHaveBeenNthCalledWith(1, {
            activeSection: 'sell',
            forceReload: false,
        });
        expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
            activeSection: 'sell',
            forceReload: true,
        });

        await act(() => {
            store.dispatch(tradingSellActions.setTradingAccountKey(btc2Account.key));
        });
        expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
            activeSection: 'sell',
            forceReload: false,
        });
    });

    describe('on send account descriptor change', () => {
        let initialThunkLoadActionSpy: jest.SpyInstance;

        beforeEach(() => {
            initialThunkLoadActionSpy = jest
                .spyOn(tradingThunks, 'loadInitialDataThunk')
                .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);
        });

        it('should dispatch loadInitialDataThunk when account is changed with descriptor', async () => {
            const store = getInitializedStore(undefined);
            await renderUseSellData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc2Account.key));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'sell',
                forceReload: false,
            });
        });

        it('should not dispatch loadInitialDataThunk when descriptor is not changed', async () => {
            const store = getInitializedStore(btc2Account.key);
            await renderUseSellData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc2Account.key));
            });

            // Wait for effects to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(0);
        });

        it('should dispatch loadInitialDataThunk without a forced API key when descriptor is empty string', async () => {
            const store = getInitializedStore(btc1Account.key);
            await renderUseSellData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(btc3Account.key));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'sell',
                forceReload: false,
            });
        });

        it('should dispatch loadInitialDataThunk without a forced API key when descriptor is undefined', async () => {
            const store = getInitializedStore(btc1Account.key);
            await renderUseSellData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingSellActions.setTradingAccountKey(undefined));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
                activeSection: 'sell',
                forceReload: false,
            });
        });
    });
});
