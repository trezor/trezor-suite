import { useSelector } from 'react-redux';

import { selectBuyTradeableAssets } from '@suite-native/trading-state';

import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectBuyTradeableAssets);

    return useTradeableAssetsFilteredData({ assets });
};
