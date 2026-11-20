import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { useQueryClient } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asTimestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { act, renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { useAssetPrice } from './useAssetPrice';

jest.mock('@suite-common/fiat-services', () => ({
    fetchErc4626UnderlyingAsset: jest.fn(),
    getFiatRatesForTimestamps: jest.fn(),
}));

const getFiatRatesForTimestampsMock = jest.mocked(getFiatRatesForTimestamps);

const ethSymbol = asNetworkSymbol('eth');

describe('useAssetPrice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses the current Redux rate with the historical rate', async () => {
        getFiatRatesForTimestampsMock.mockResolvedValue({
            ts: asTimestamp(0),
            symbol: ethSymbol,
            tickers: [{ ts: asTimestamp(0), rates: { usd: 100 } }],
        });

        const { result } = await renderHookWithStoreProvider(
            () => useAssetPrice({ networkSymbol: ethSymbol }),
            {
                preloadedState: {
                    device: { devices: [], selectedDevice: undefined },
                    wallet: {
                        settings: { localCurrency: 'usd' },
                        blockchain: { eth: { backends: {} } },
                        fiat: {
                            current: { [getFiatRateKey(ethSymbol, 'usd')]: { rate: 110 } },
                            lastWeek: {},
                        },
                    },
                },
            },
        );

        await waitFor(() => {
            expect(result.current.price?.toNumber()).toBe(110);
            expect(result.current.sevenDayPercentageChange).toBeCloseTo(0.1);
        });
    });

    it('keeps the seven day change when a refetch fails', async () => {
        getFiatRatesForTimestampsMock.mockResolvedValueOnce({
            ts: asTimestamp(0),
            symbol: ethSymbol,
            tickers: [{ ts: asTimestamp(0), rates: { usd: 100 } }],
        });

        const { result, rerender } = await renderHookWithStoreProvider(
            () => ({
                assetPrice: useAssetPrice({ networkSymbol: ethSymbol }),
                queryClient: useQueryClient(),
            }),
            {
                preloadedState: {
                    device: { devices: [], selectedDevice: undefined },
                    wallet: {
                        settings: { localCurrency: 'usd' },
                        blockchain: { eth: { backends: {} } },
                        fiat: {
                            current: { [getFiatRateKey(ethSymbol, 'usd')]: { rate: 110 } },
                            lastWeek: {},
                        },
                    },
                },
            },
        );

        await waitFor(() =>
            expect(result.current.assetPrice.sevenDayPercentageChange).toBeCloseTo(0.1),
        );

        getFiatRatesForTimestampsMock.mockResolvedValueOnce(null);
        await act(() => result.current.queryClient.refetchQueries());
        await rerender({});

        expect(getFiatRatesForTimestampsMock).toHaveBeenCalledTimes(2);
        expect(result.current.assetPrice.sevenDayPercentageChange).toBeCloseTo(0.1);
    });
});
