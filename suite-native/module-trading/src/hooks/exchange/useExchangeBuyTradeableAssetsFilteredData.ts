import { useSelector } from 'react-redux';

import { selectExchangeBuyTradeableAssetsSorted } from '../../selectors/exchangeSelectors';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectExchangeBuyTradeableAssetsSorted);

    return useTradeableAssetsFilteredData({ assets });
};
