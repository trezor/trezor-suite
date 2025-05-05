import { useBuyTradeableAssetsFilteredData } from '../../hooks/useBuyTradeableAssetsFilteredData';
import {
    TradeableAssetsSheet,
    TradeableAssetsSheetProps,
} from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

export type BuyTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter' | 'flashListKey'
>;

export const BuyTradeableAssetsSheet = (props: BuyTradeableAssetsSheetProps) => {
    const { filteredData, filterValue, setFilterValue, setFilterSymbol } =
        useBuyTradeableAssetsFilteredData();

    // re-mount FLashList component when filterValue changes (resets scroll position)
    const flashListKey = 'buy_tradeable_assets-' + filterValue;

    return (
        <TradeableAssetsSheet
            assets={filteredData}
            onFilterChange={setFilterValue}
            {...props}
            onSelectedNetworkFilter={setFilterSymbol}
            flashListKey={flashListKey}
        />
    );
};
