import { useSelector } from 'react-redux';

import { selectBuyTradeableAssets } from '../../selectors/buySelectors';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectBuyTradeableAssets);

    return useTradeableAssetsFilteredData({ assets });
};
