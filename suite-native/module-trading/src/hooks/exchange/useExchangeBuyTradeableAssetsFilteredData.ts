import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import {
    type TradingRootState,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import { useExchangeFormContext } from './useExchangeFormContext';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const { watch } = useExchangeFormContext();
    const sendAsset = watch('sendAsset');
    const supportedNetworks = networkModuleRepository.getSupportedNetwork();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectExchangeBuyTradeableAssets(state, supportedNetworks, sendAsset?.cryptoId),
    );

    return useTradeableAssetsFilteredData({ assets });
};
