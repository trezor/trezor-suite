import { useBuyTradeableAssetsFilteredData } from '../../hooks/useBuyTradeableAssetsFilteredData';
import {
    TradeableAssetsSheet,
    TradeableAssetsSheetProps,
} from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

export type BuyTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter'
>;

export const BuyTradeableAssetsSheet = (props: BuyTradeableAssetsSheetProps) => {
    const { filteredData, setFilterValue, setFilterSymbol } = useBuyTradeableAssetsFilteredData();

    return (
        <TradeableAssetsSheet
            assets={filteredData}
            onFilterChange={setFilterValue}
            {...props}
            onSelectedNetworkFilter={setFilterSymbol}
        />
    );
};
