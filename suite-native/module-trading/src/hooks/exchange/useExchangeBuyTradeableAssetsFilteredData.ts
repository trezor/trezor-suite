import { useSelector } from 'react-redux';

import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import {
    type TradingRootState,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectExchangeBuyTradeableAssets(state),
    );

    return useTradeableAssetsFilteredData({ assets });
};
