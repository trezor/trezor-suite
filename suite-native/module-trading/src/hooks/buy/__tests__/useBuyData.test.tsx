import { tradingThunks } from '@suite-common/trading';
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { useTradingBuyData } from '../useBuyData';

describe('useTradingBuyData', () => {
    const renderUseTradingData = (reloadRequestOrdinalInitialValue: number = 0) =>
        renderHookWithStoreProviderAsync(
            ({ reloadRequestOrdinal }) => useTradingBuyData(reloadRequestOrdinal),
            {
                initialProps: { reloadRequestOrdinal: reloadRequestOrdinalInitialValue },
            },
        );

    beforeEach(() => {
        jest.resetAllMocks();
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
        const { result } = await renderUseTradingData();

        expect(result.current.isLoading).toBe(true);
        expect(result.current.lastLoadedTimestamp).toBe(0);
    });

    it('should settle after API queries are resolved', async () => {
        const { result } = await renderUseTradingData();

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBeGreaterThan(0);
    });

    it('should dispatch loadInitialDataThunk only once', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { rerender } = await renderUseTradingData();
        rerender({ reloadRequestOrdinal: 0 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch loadInitialDataThunk when reloadRequestOrdinal changes', async () => {
        const initialThunkLoadActionSpy = jest
            .spyOn(tradingThunks, 'loadInitialDataThunk')
            .mockImplementation((() => ({ type: 'TEST_ACTION' })) as () => any);

        const { rerender } = await renderUseTradingData();
        rerender({ reloadRequestOrdinal: 1 });

        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(2);
    });
});
