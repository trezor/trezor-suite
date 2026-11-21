import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type LoadInitialDataThunkDeps,
    tradingBuyActions,
    tradingThunks,
} from '@suite-common/trading';
import {
    mockGetSelectedAccount,
    mockGetTradingEnvironment,
    mockTradingQueryClient,
} from '@suite-common/trading/mocks';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { type LocaleSliceRootState, localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
    act,
    createStaticReducer,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type TradingRootState, tradingSlice } from '@suite-native/trading-state';
import { type TradingState } from '@suite-native/trading-types';
import { mockActionType } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import { useBuyData } from './useBuyData';
import { useExchangeData } from '../exchange/useExchangeData';
import { useSellData } from '../sell/useSellData';

// The hook also selects wallet settings and locale while dispatching the trading load thunk.
type State = TradingRootState & AccountsRootState & WalletSettingsRootState & LocaleSliceRootState;

const btc1Account = getBtcAccount({ descriptor: asAccountDescriptor('btc1normal') });
const btc2Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount2') });
const btc3Account = getBtcAccount({ descriptor: asAccountDescriptor('btcAccount3') });

describe('useBuyData', () => {
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

    // The hook reads the catalog status from the query client that the thunk loads the catalogs into.
    const initServices = (preloadedState?: PreloadedStatePartial<State>) =>
        createTestCompositionRoot<LoadInitialDataThunkDeps, State>({
            reducer,
            preloadedState,
            services: () => ({
                getSelectedAccount: mockGetSelectedAccount(),
                getTradingEnvironment: mockGetTradingEnvironment(),
                queryClient: mockTradingQueryClient(),
            }),
        }).services;

    type TestServices = ReturnType<typeof initServices>;

    const getInitializedServices = (tradingAccountKey: AccountKey | undefined) => {
        const tradingState: TradingState = getInitializedTradingState();
        tradingState.buy.tradingAccountKey = tradingAccountKey;

        const preloadedState: PreloadedStatePartial<State> = {
            wallet: {
                trading: tradingState,
            },
        };

        return initServices(preloadedState);
    };

    const renderUseBuyData = async (services: TestServices) => {
        const ret = await renderHookWithStoreProvider(useBuyData, { services });

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
        const services = initServices();
        const { result } = await renderUseBuyData(services);

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const services = initServices();
        const { result } = await renderUseBuyData(services);

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it.each([
        {
            section: 'exchange',
            useData: useExchangeData,
            catalogPaths: ['/api/info', '/api/v3/exchange/list'],
        },
        { section: 'sell', useData: useSellData, catalogPaths: ['/api/info', '/api/v3/sell/list'] },
        { section: 'buy', useData: useBuyData, catalogPaths: ['/api/info', '/api/v3/buy/list'] },
    ])(
        'reuses the catalog when remounting $section and refetches on Retry',
        async ({ useData, catalogPaths }) => {
            const buyCatalogPaths = ['/api/info', '/api/v3/buy/list'];
            const services = initServices();
            const buy = await renderUseBuyData(services);
            await buy.unmount();
            expect(global.fetch).toHaveBeenCalledTimes(buyCatalogPaths.length);

            const tab = await renderHookWithStoreProvider(useData, { services });
            await act(() => Promise.resolve());
            await tab.unmount();
            // The tab reuses the coin info from the cache, and the buy tab its whole catalog set.
            const initialPaths = [
                ...buyCatalogPaths,
                ...catalogPaths.filter(path => !buyCatalogPaths.includes(path)),
            ];
            expect(global.fetch).toHaveBeenCalledTimes(initialPaths.length);

            const retry = await renderHookWithStoreProvider(useData, { services });
            expect(global.fetch).toHaveBeenCalledTimes(initialPaths.length);
            await act(async () => {
                await retry.result.current.refetch();
            });
            expect(jest.mocked(global.fetch).mock.calls.map(([url]) => url)).toEqual(
                [...initialPaths, ...catalogPaths].map(path => expect.stringContaining(path)),
            );
        },
    );

    it('keeps the Swap tab loading until the swap catalog loads, while Buy and Sell are ready', async () => {
        const catalogResponse = {
            json: () => Promise.resolve({ coins: {}, platforms: {}, config: {} }),
            ok: true,
        };
        const pendingExchangeList = createDeferred<typeof catalogResponse>();
        global.fetch = jest
            .fn()
            .mockImplementation((url: string) =>
                url.includes('/api/v3/exchange/list')
                    ? pendingExchangeList.promise
                    : Promise.resolve(catalogResponse),
            );
        const services = initServices();
        const buy = await renderUseBuyData(services);
        const sell = await renderHookWithStoreProvider(useSellData, { services });
        const swap = await renderHookWithStoreProvider(useExchangeData, { services });
        await act(() => Promise.resolve());

        expect(swap.result.current).toMatchObject({ isLoading: true, lastLoadedTimestamp: 0 });
        expect(buy.result.current.isLoading).toBe(false);
        expect(buy.result.current.lastLoadedTimestamp).toBeGreaterThan(0);
        expect(sell.result.current.isLoading).toBe(false);
        expect(sell.result.current.lastLoadedTimestamp).toBeGreaterThan(0);

        pendingExchangeList.resolve(catalogResponse);

        await waitFor(() => expect(swap.result.current.isLoading).toBe(false));
        expect(swap.result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const services = initServices();
        const { rerender } = await renderUseBuyData(services);
        await rerender({});

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should force reload on refetch and respect the cache on subsequent account changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const services = initServices();
        const { result } = await renderUseBuyData(services);
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
            services.store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
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
            const services = getInitializedServices(undefined);
            await renderUseBuyData(services);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                services.store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
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
            const services = getInitializedServices(btc2Account.key);
            await renderUseBuyData(services);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                services.store.dispatch(tradingBuyActions.setTradingAccountKey(btc2Account.key));
            });

            // Wait for effects to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(0);
        });

        it('should dispatch loadInitialDataThunk without a forced API key when descriptor is empty string', async () => {
            const services = getInitializedServices(btc1Account.key);
            await renderUseBuyData(services);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                services.store.dispatch(tradingBuyActions.setTradingAccountKey(btc3Account.key));
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
            const services = getInitializedServices(btc1Account.key);
            await renderUseBuyData(services);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            await act(() => {
                services.store.dispatch(tradingBuyActions.setTradingAccountKey(undefined));
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
