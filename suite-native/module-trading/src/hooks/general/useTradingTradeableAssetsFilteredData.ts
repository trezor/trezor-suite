import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TradingRootState, selectTradeableAssetBalances } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { usePreferredCurrencyUsdThreshold } from './usePreferredCurrencyUsdThreshold';
import { useTradeableAssetsFilteredData } from './useTradeableAssetsFilteredData';

type TradeableAssetsSelector = (
    state: TradingRootState & FeatureFlagsRootState,
    supportedNetworks: readonly NetworkSymbol[],
) => TradeableAsset[];

export const useTradingTradeableAssetsFilteredData = (
    selectTradeableAssets: TradeableAssetsSelector,
) => {
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const supportedNetworks = networkModuleRepository.getSupportedNetworks();
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
