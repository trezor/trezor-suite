import { useSelector } from 'react-redux';

import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { useWatch } from '@suite-native/forms';
import {
    type TradingRootState,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import { useExchangeFormContext } from './useExchangeFormContext';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const { control } = useExchangeFormContext();
    const sendAsset = useWatch({ control, name: 'sendAsset' });
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectExchangeBuyTradeableAssets(state, sendAsset?.cryptoId),
    );

    return useTradeableAssetsFilteredData({ assets });
};
