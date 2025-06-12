import { useSelector } from 'react-redux';

import { selectExchangeTradeableAssetsSorted } from '../../selectors/exchangeSelectors';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectExchangeTradeableAssetsSorted);

    return useTradeableAssetsFilteredData({ assets });
};
