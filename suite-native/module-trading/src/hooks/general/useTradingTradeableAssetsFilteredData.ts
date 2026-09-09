import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetSupportedNetworksDep } from '@suite-common/networks';
import { usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState, selectTradeableAssetBalances } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useTradeableAssetsFilteredData } from './useTradeableAssetsFilteredData';

type TradeableAssetsSelector = (
    state: TradingRootState & FeatureFlagsRootState,
    supportedNetworks: readonly NetworkSymbol[],
) => TradeableAsset[];

export const useTradingTradeableAssetsFilteredData = (
    selectTradeableAssets: TradeableAssetsSelector,
) => {
    const { getSupportedNetworks } = useServices(selectGetSupportedNetworksDep);
    const supportedNetworks = getSupportedNetworks();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectTradeableAssets(state, supportedNetworks),
    );
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
