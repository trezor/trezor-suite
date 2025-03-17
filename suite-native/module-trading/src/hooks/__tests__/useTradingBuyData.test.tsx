import { tradingThunks } from '@suite-common/trading';
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { useTradingBuyData } from '../useTradingBuyData';

describe('useTradingBuyData', () => {
    const renderUseTradingData = () => renderHookWithStoreProviderAsync(() => useTradingBuyData());

    beforeEach(() => {
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
        const initialThunkLoadActionSpy = jest.spyOn(tradingThunks, 'loadInitialDataThunk');

        const { result, rerender } = await renderUseTradingData();
        const firstTimestamp = result.current.lastLoadedTimestamp;
        rerender({});

        expect(result.current.isLoading).toBe(false);
        expect(result.current.lastLoadedTimestamp).toBe(firstTimestamp);
        expect(initialThunkLoadActionSpy).toHaveBeenCalledTimes(1);
    });
});
