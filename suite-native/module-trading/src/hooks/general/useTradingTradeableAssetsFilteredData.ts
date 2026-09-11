import { useSelector } from 'react-redux';

import { type NetworksRootState } from '@suite-common/networks';
import { usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState, selectTradeableAssetBalances } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useTradeableAssetsFilteredData } from './useTradeableAssetsFilteredData';

type TradeableAssetsSelector = (
    state: TradingRootState & FeatureFlagsRootState & NetworksRootState,
) => TradeableAsset[];

export const useTradingTradeableAssetsFilteredData = (
    selectTradeableAssets: TradeableAssetsSelector,
) => {
    const assets = useSelector(selectTradeableAssets);
    const assetBalances = useSelector(selectTradeableAssetBalances);
    const preferredCurrencyUsdThreshold = usePreferredCurrencyUsdThreshold();

    const data = useTradeableAssetsFilteredData({
        assets,
        assetBalances,
        preferredCurrencyUsdThreshold,
    });

    return {
        ...data,
        assetBalances,
    };
};
