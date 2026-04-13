import { tradingExchangeActions, tradingThunks } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type PreloadedState,
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useExchangeData } from '../useExchangeData';

jest.mock('../../../utils/general/utils', () => ({
    ...jest.requireActual('../../../utils/general/utils'),
    getRandomAccountDescriptor: () => 'random_string',
}));

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc-account-2' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc3AccountKey = 'btc-account-3' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useExchangeData', () => {
    const getInitializedStore = (tradingAccountKey: string | undefined) => {
        const preloadedState: PreloadedState = {
            wallet: {
                trading: getInitializedTradingState('exchange'),
                accounts: [
                    getBtcAccount(btc1AccountKey),
                    getBtcAccount(btc2AccountKey),
                    { ...getBtcAccount(btc3AccountKey), descriptor: '' },
                ],
            },
        };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = tradingAccountKey;

        return initStore(preloadedState).store;
    };

    const renderUseExchangeData = async (
        reloadRequestOrdinalInitialValue: number = 0,
        store?: TestStore,
    ) => {
        const ret = renderHookWithStoreProvider(
            ({ reloadRequestOrdinal }) => useExchangeData(reloadRequestOrdinal),
            {
                initialProps: { reloadRequestOrdinal: reloadRequestOrdinalInitialValue },
                store,
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
        const { result } = await renderUseExchangeData();

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const { result } = await renderUseExchangeData();

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { rerender } = await renderUseExchangeData();
        rerender({ reloadRequestOrdinal: 0 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch loadInitialDataThunk when reloadRequestOrdinal changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { rerender } = await renderUseExchangeData();
        rerender({ reloadRequestOrdinal: 1 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(2);
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
            await renderUseExchangeData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc2AccountKey));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'exchange',
                forcedApiKey: undefined,
            });
        });

        it('should not dispatch loadInitialDataThunk when descriptor is not changed', async () => {
            const store = getInitializedStore(btc2AccountKey);
            await renderUseExchangeData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc2AccountKey));
            });

            // Wait for effects to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(0);
        });

        it('should dispatch loadInitialDataThunk with random string when descriptor is empty string', async () => {
            const store = getInitializedStore('btc-account-1');
            await renderUseExchangeData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(btc3AccountKey));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenCalledWith({
                activeSection: 'exchange',
                forcedApiKey: 'random_string',
            });
        });

        it('should dispatch loadInitialDataThunk with random string when descriptor is undefined', async () => {
            const store = getInitializedStore('btc-account-1');
            await renderUseExchangeData(0, store);

            // Clear the initial call
            initialThunkLoadActionSpy.mockClear();

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
            });

            // Wait for the effect to run
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
            expect(initialThunkLoadActionSpy).toHaveBeenLastCalledWith({
                activeSection: 'exchange',
                forcedApiKey: 'random_string',
            });
        });
    });
});
