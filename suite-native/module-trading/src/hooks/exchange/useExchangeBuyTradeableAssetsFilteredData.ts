import { useSelector } from 'react-redux';

import { selectExchangeBuyTradeableAssets } from '../../selectors/exchangeSelectors';
import { useTradeableAssetsFilteredData } from '../general/useTradeableAssetsFilteredData';

export const useExchangeBuyTradeableAssetsFilteredData = () => {
    const assets = useSelector(selectExchangeBuyTradeableAssets);

    return useTradeableAssetsFilteredData({ assets });
};
