import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useTradeableAssetFiatRate } from './useTradeableAssetFiatRate';
import { createTradingPreloadedState } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFiatRatesThunk: jest.fn(() => ({ type: 'mockUpdateFiatRates' })),
}));

describe('useTradeableAssetFiatRate', () => {
    const renderTradeableAssetFiatRate = async (
        asset: TradeableAsset | undefined,
        shouldFetchCurrentRate?: boolean,
    ) =>
        await renderHookWithStoreProvider(
            () => useTradeableAssetFiatRate(asset, { shouldFetchCurrentRate }),
            { preloadedState: createTradingPreloadedState() },
        );

    beforeEach(() => {
        jest.mocked(updateFiatRatesThunk).mockClear();
    });

    it.each([
        ['native asset', ethAsset, 1000],
        ['token', usdcAsset, 0.99],
    ])('should return rate of %s', async (_, asset, expectedRate) => {
        const { result } = await renderTradeableAssetFiatRate(asset);

        expect(result.current).toBe(expectedRate);
    });

    it('should not fetch the rate by default', async () => {
        await renderTradeableAssetFiatRate(ethAsset);

        expect(updateFiatRatesThunk).not.toHaveBeenCalled();
    });

    it('should fetch the current rate of the asset in base currency when requested', async () => {
        await renderTradeableAssetFiatRate(usdcAsset, true);

        expect(updateFiatRatesThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                tickers: [{ symbol: 'eth', tokenAddress: usdcAsset.contractAddress }],
                baseCurrencyCode: 'usd',
                rateType: 'current',
                forceFetchToken: true,
            }),
        );
    });

    it('should not fetch the rate when asset is not selected', async () => {
        const { result } = await renderTradeableAssetFiatRate(undefined, true);

        expect(result.current).toBeUndefined();
        expect(updateFiatRatesThunk).not.toHaveBeenCalled();
    });
});
