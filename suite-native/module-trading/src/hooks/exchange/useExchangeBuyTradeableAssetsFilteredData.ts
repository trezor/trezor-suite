import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import { useExchangeFormContext } from './useExchangeFormContext';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const { watch } = useExchangeFormContext();
    const sendAsset = watch('sendAsset');
    const assets = useSelector((state: TradingRootState) =>
        selectExchangeBuyTradeableAssets(state, sendAsset?.cryptoId),
    );

    return useTradeableAssetsFilteredData({ assets });
};
