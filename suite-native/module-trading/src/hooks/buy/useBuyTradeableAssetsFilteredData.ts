import { useSelector } from 'react-redux';

import { selectBuyTradeableAssetsSorted } from '../../selectors/buySelectors';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectBuyTradeableAssetsSorted);

    return useTradeableAssetsFilteredData({ assets });
};
