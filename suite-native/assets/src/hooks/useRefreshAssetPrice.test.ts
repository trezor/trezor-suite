import { type AssetsRootState } from '@suite-common/assets';
import { deviceInitialState } from '@suite-common/device';
import { fetchCurrentFiatRates } from '@suite-common/fiat-services';
import { useQuery } from '@suite-common/react-query';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    accountsInitialState,
    blockchainInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import {
    act,
    mergePreloadedState,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';

import { getAssetPriceHistoryQueryKey, useRefreshAssetPrice } from './useRefreshAssetPrice';

jest.mock('@suite-common/fiat-services', () => ({
    fetchCurrentFiatRates: jest.fn(),
}));

type RefreshAssetPricePreloadedState = AssetsRootState &
    BlockchainRootState &
    WalletSettingsRootState;

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const preloadedState = mergePreloadedState<RefreshAssetPricePreloadedState>(
    {
        device: deviceInitialState,
        wallet: {
            accounts: accountsInitialState,
            blockchain: blockchainInitialState,
            settings: initialWalletSettingsState,
        },
    },
    { wallet: { settings: { localCurrency: 'eur' } } },
);

describe('useRefreshAssetPrice', () => {
    it('refetches the current rate, the seven day change and the chart of the asset only', async () => {
        const fetchSevenDayChange = jest.fn().mockResolvedValue(null);
        const fetchChart = jest.fn().mockResolvedValue([]);
        const fetchOtherAssetChart = jest.fn().mockResolvedValue([]);

        const { result } = await renderHookWithStoreProvider(
            () => {
                useQuery({
                    queryKey: getAssetPriceHistoryQueryKey(
                        ethSymbol,
                        undefined,
                        false,
                        'eur',
                        undefined,
                    ),
                    queryFn: fetchSevenDayChange,
                });
                useQuery({
                    queryKey: getAssetPriceHistoryQueryKey(ethSymbol, undefined, 'eur', '1W'),
                    queryFn: fetchChart,
                });
                useQuery({
                    queryKey: getAssetPriceHistoryQueryKey(btcSymbol, undefined, 'eur', '1W'),
                    queryFn: fetchOtherAssetChart,
                });

                return useRefreshAssetPrice({ networkSymbol: ethSymbol });
            },
            { preloadedState },
        );

        await waitFor(() => {
            expect(fetchSevenDayChange).toHaveBeenCalledTimes(1);
            expect(fetchChart).toHaveBeenCalledTimes(1);
            expect(fetchOtherAssetChart).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            await result.current();
            // Lets react-query flush its batched notifications inside act.
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(fetchSevenDayChange).toHaveBeenCalledTimes(2);
        expect(fetchChart).toHaveBeenCalledTimes(2);
        expect(fetchOtherAssetChart).toHaveBeenCalledTimes(1);
        expect(fetchCurrentFiatRates).toHaveBeenCalledWith(
            expect.objectContaining({
                ticker: { symbol: ethSymbol, tokenAddress: undefined, protocols: undefined },
                localCurrency: 'eur',
            }),
        );
    });
});
