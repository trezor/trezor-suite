import { useSelector } from 'react-redux';

import { useTradeableAssetsFilteredData } from './useTradeableAssetsFilteredData';
import { selectBuyTradeableAssetsSorted } from '../selectors/buySelectors';

export const useBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectBuyTradeableAssetsSorted);

    return useTradeableAssetsFilteredData({ assets });
};
