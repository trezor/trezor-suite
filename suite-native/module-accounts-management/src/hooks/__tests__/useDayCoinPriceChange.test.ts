import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { useDayCoinPriceChange } from '../useDayCoinPriceChange';

jest.mock('@suite-common/fiat-services', () => ({
    getFiatRatesForTimestamps: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectBaseCurrency: () => 'usd',
    selectIsElectrumBackendSelected: () => false,
}));

const mockGetFiatRatesForTimestamps = getFiatRatesForTimestamps as jest.Mock;

const tokenContract = '0x0000000000000000000000000000000000000001' as TokenAddress;

describe('useDayCoinPriceChange', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('starts in loading state', () => {
        mockGetFiatRatesForTimestamps.mockReturnValue(new Promise(() => {}));

        const { result } = renderHookWithStoreProvider(() =>
            useDayCoinPriceChange('eth', tokenContract),
        );

        expect(result.current.isLoading).toBe(true);
        expect(result.current.currentValue).toBeNull();
    });

    it('exposes the current price once the fetch resolves with rates', async () => {
        mockGetFiatRatesForTimestamps.mockResolvedValue({
            tickers: [{ rates: { usd: 100 } }, { rates: { usd: 110 } }],
        });

        const { result } = renderHookWithStoreProvider(() =>
            useDayCoinPriceChange('eth', tokenContract),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentValue?.toNumber()).toBe(110);
    });

    it('reports no price when the fetch returns no rates (token not on CoinGecko)', async () => {
        mockGetFiatRatesForTimestamps.mockResolvedValue(undefined);

        const { result } = renderHookWithStoreProvider(() =>
            useDayCoinPriceChange('eth', tokenContract),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentValue).toBeNull();
    });

    it('reports no price when the fetch fails', async () => {
        mockGetFiatRatesForTimestamps.mockRejectedValue(new Error('fetch failed'));

        const { result } = renderHookWithStoreProvider(() =>
            useDayCoinPriceChange('eth', tokenContract),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.currentValue).toBeNull();
    });
});
