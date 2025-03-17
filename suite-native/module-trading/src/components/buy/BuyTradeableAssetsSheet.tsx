import { useSelector } from 'react-redux';

import { selectBuyTradeableAssetsSorted } from '../../selectors/buySelectors';
import {
    TradeableAssetsSheet,
    TradeableAssetsSheetProps,
} from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

export type BuyTradeableAssetsSheetProps = Omit<TradeableAssetsSheetProps, 'assets'>;

export const BuyTradeableAssetsSheet = (props: BuyTradeableAssetsSheetProps) => {
    const assets = useSelector(selectBuyTradeableAssetsSorted);

    return <TradeableAssetsSheet assets={assets} {...props} />;
};
