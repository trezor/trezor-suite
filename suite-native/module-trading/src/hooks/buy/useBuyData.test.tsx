import { combineReducers } from '@reduxjs/toolkit';

import { type ReduxStoreWithThunk } from '@suite-common/redux-utils';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type LoadInitialDataThunkDeps,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import { mockGetSelectedAccount, mockGetTradingEnvironment } from '@suite-common/trading/mocks';
import { type AccountsRootState, initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    act,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';
import { type TradingState } from '@suite-native/trading-types';

import { useBuyData } from './useBuyData';
import { useExchangeData } from '../exchange/useExchangeData';
import { useSellData } from '../sell/useSellData';

type State = TradingRootState & AccountsRootState;

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount2') });
const btc3Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount3') });

describe('useBuyData', () => {
    const extra: LoadInitialDataThunkDeps = {
        services: {
            getSelectedAccount: mockGetSelectedAccount(),
            getTradingEnvironment: mockGetTradingEnvironment(),
        },
    };

    const getAccounts = () => [
        btc1Account,
        btc2Account,
        { ...btc3Account, descriptor: asAccountDescriptor('') },
    ];

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getAccounts()),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const getInitializedStore = (tradingAccountKey: AccountKey | undefined) => {
        const tradingState: TradingState = getInitializedTradingState();
        tradingState.buy.tradingAccountKey = tradingAccountKey;

        const preloadedState: PreloadedStatePartial<State> = {
            wallet: {
                trading: tradingState,
            },
        };

        return createTestCompositionRoot({ extra, reducer, preloadedState }).store;
    };

    const renderUseBuyData = async (
        store: ReduxStoreWithThunk<State, LoadInitialDataThunkDeps>,
    ) => {
        const ret = await renderHookWithStoreProvider(useBuyData, {
            services: { store },
        });

        await act(() => Promise.resolve()); // Wait for all effects to run

        return ret;
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve({ coins: {}, platforms: {}, config: {} }),
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
                            json: () => Promise.resolve({ coins: {}, platforms: {}, config: {} }),
                            ok: true,
                        });
                    }, 100);
                }),
        );
        const { store } = createTestCompositionRoot({ extra, reducer });
        const { result } = await renderUseBuyData(store);

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const { store } = createTestCompositionRoot({ extra, reducer });
        const { result } = await renderUseBuyData(store);

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it.each([
        { section: 'exchange', useData: useExchangeData },
        { section: 'sell', useData: useSellData },
        { section: 'buy', useData: useBuyData },
    ])(
        'reuses the catalog when remounting $section and refetches on Retry',
        async ({ useData }) => {
            const { store } = createTestCompositionRoot({ extra, reducer });
            const buy = await renderUseBuyData(store);
            await buy.unmount();
            expect(global.fetch).toHaveBeenCalledTimes(4);

            const tab = await renderHookWithStoreProvider(useData, { services: { store } });
            expect(global.fetch).toHaveBeenCalledTimes(4);
            await tab.unmount();

            const retry = await renderHookWithStoreProvider(useData, { services: { store } });
            expect(global.fetch).toHaveBeenCalledTimes(4);
            await act(async () => {
                await retry.result.current.refetch();
            });
            expect(global.fetch).toHaveBeenCalledTimes(8);
            expect(jest.mocked(global.fetch).mock.calls.map(([url]) => url)).toEqual(
                [
                    ...[
                        '/api/info',
                        '/api/v3/buy/list',
                        '/api/v3/exchange/list',
                        '/api/v3/sell/list',
                    ],
                    ...[
                        '/api/info',
                        '/api/v3/buy/list',
                        '/api/v3/exchange/list',
                        '/api/v3/sell/list',
                    ],
                ].map(path => expect.stringContaining(path)),
            );
        },
    );

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { store } = createTestCompositionRoot({ extra, reducer });
        const { rerender } = await renderUseBuyData(store);
        await rerender({});

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should force reload on refetch and respect the cache on subsequent account changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { store } = createTestCompositionRoot({ extra, reducer });
        const { result } = await renderUseBuyData(store);
        await act(async () => {
            await result.current.refetch();
        });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(2);
        expect(initialThunkLoadActionSpy).toHaveBeenNthCalledWith(1, {
            activeSection: 'buy',
            forceReload: false,
        });
        expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
            activeSection: 'buy',
            forceReload: true,
        });

        await act(() => {
            store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
        });
        expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
            activeSection: 'buy',
            forceReload: false,
        });
    });

    describe('on receive account descriptor change', () => {
        let initialThunkLoadActionSpy: jest.SpyInstance;

        beforeEach(() => {
            initialThunkLoadActionSpy = jest
                .spyOn(tradingThunks, 'loadInitialDataThunk')
                .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);
        });

        it('should dispatch loadInitialDataThunk when account is changed with descriptor', async () => {
            const store = getInitializedStore(undefined);
            await renderUseBuyData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'buy',
                forceReload: false,
            });
        });

        it('should not dispatch loadInitialDataThunk when descriptor is not changed', async () => {
            const store = getInitializedStore(btc2Account.key);
            await renderUseBuyData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
            });

            // Wait for effects to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(0);
        });

        it('should dispatch loadInitialDataThunk without a forced API key when descriptor is empty string', async () => {
            const store = getInitializedStore(btc1Account.key);
            await renderUseBuyData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc3Account.key));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'buy',
                forceReload: false,
            });
        });

        it('should dispatch loadInitialDataThunk without a forced API key when descriptor is undefined', async () => {
            const store = getInitializedStore(btc1Account.key);
            await renderUseBuyData(store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(undefined));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
                activeSection: 'buy',
                forceReload: false,
            });
        });
    });
});
