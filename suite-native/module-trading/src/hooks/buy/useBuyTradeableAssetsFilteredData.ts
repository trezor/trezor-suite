import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectBuyTradeableAssets } from '@suite-native/trading-state';
import type { TradingRootState } from '@suite-native/trading-state';

import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useBuyTradeableAssetsFilteredData = () => {
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const supportedNetworks = networkModuleRepository.getSupportedNetworks();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectBuyTradeableAssets(state, supportedNetworks),
    );

    return useTradeableAssetsFilteredData({ assets });
};
