import { useSelector } from 'react-redux';

import { selectExchangeBuyTradeableAssets } from '@suite-native/trading-state';

import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectExchangeBuyTradeableAssets);

    return useTradeableAssetsFilteredData({ assets });
};
