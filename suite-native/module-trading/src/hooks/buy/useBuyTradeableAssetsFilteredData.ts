import { useSelector } from 'react-redux';

import { selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectBuyTradeableAssets } from '@suite-native/trading-state';
import type { TradingRootState } from '@suite-native/trading-state';

import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useBuyTradeableAssetsFilteredData = () => {
    const { addressValidator } = useServices(selectAddressValidatorDep);
    const supportedCoins = addressValidator.getSupportedCoins();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectBuyTradeableAssets(state, supportedCoins),
    );

    return useTradeableAssetsFilteredData({ assets });
};
