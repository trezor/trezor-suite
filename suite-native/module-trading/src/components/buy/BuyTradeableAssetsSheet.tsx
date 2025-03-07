import { useSelector } from 'react-redux';

import { selectTradingBuyCoins } from '../../tradingSlice';
import {
    TradeableAssetsSheet,
    TradeableAssetsSheetProps,
} from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

export type BuyTradeableAssetsSheetProps = Omit<TradeableAssetsSheetProps, 'assets'>;

export const BuyTradeableAssetsSheet = (props: BuyTradeableAssetsSheetProps) => {
    const assets = useSelector(selectTradingBuyCoins);

    return <TradeableAssetsSheet assets={assets} {...props} />;
};
