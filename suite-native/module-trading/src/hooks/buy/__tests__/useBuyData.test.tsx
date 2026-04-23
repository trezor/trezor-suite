import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { tradingBuyActions, tradingThunks } from '@suite-common/trading';
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

import { useBuyData } from '../useBuyData';

jest.mock('../../../utils/general/utils', () => ({
    ...jest.requireActual('../../../utils/general/utils'),
    getRandomAccountDescriptor: () => 'random_string',
}));

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc-account-2' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc3AccountKey = 'btc-account-3' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useBuyData', () => {
    const getAccounts = () => [
        getBtcAccount(btc1AccountKey),
        getBtcAccount(btc2AccountKey),
        { ...getBtcAccount(btc3AccountKey), descriptor: asAccountDescriptor('') },
    ];

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(getAccounts()),
            trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
        }),
    } as const;

    const getInitializedStore = (tradingAccountKey: AccountKey | undefined) => {
        const preloadedState = {
            wallet: {
                trading: getInitializedTradingState(),
            },
        };
        preloadedState.wallet.trading.buy.tradingAccountKey = tradingAccountKey;

        return configureMockStore({ reducer, preloadedState });
    };

    const renderUseBuyData = async (reloadRequestOrdinalInitialValue: number, store: TestStore) => {
        const ret = renderHookWithStoreProvider(
            ({ reloadRequestOrdinal }) => useBuyData(reloadRequestOrdinal),
            {
                initialProps: { reloadRequestOrdinal: reloadRequestOrdinalInitialValue },
                store,
                providers: ['intl'],
            },
        );

        await act(() => Promise.resolve()); // Wait for all effects to run

        return ret;
    };

    beforeEach(() => {
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
        const store = configureMockStore({ reducer });
        const { result } = await renderUseBuyData(0, store);

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const store = configureMockStore({ reducer });
        const { result } = await renderUseBuyData(0, store);

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const store = configureMockStore({ reducer });
        const { rerender } = await renderUseBuyData(0, store);
        rerender({ reloadRequestOrdinal: 0 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch loadInitialDataThunk when reloadRequestOrdinal changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const store = configureMockStore({ reducer });
        const { rerender } = await renderUseBuyData(0, store);
        rerender({ reloadRequestOrdinal: 1 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(2);
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
            await renderUseBuyData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc2AccountKey));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'buy',
                forcedApiKey: undefined,
            });
        });

        it('should not dispatch loadInitialDataThunk when descriptor is not changed', async () => {
            const store = getInitializedStore(btc2AccountKey);
            await renderUseBuyData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc2AccountKey));
            });

            // Wait for effects to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(0);
        });

        it('should dispatch loadInitialDataThunk with random string when descriptor is empty string', async () => {
            const store = getInitializedStore(btc1AccountKey);
            await renderUseBuyData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(btc3AccountKey));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'buy',
                forcedApiKey: 'random_string',
            });
        });

        it('should dispatch loadInitialDataThunk with random string when descriptor is undefined', async () => {
            const store = getInitializedStore(btc1AccountKey);
            await renderUseBuyData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingBuyActions.setTradingAccountKey(undefined));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
                activeSection: 'buy',
                forcedApiKey: 'random_string',
            });
        });
    });
});
