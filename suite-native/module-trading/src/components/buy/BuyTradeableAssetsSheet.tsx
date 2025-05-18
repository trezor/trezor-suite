import { useBuyTradeableAssetsFilteredData } from '../../hooks/buy/useBuyTradeableAssetsFilteredData';
import {
    TradeableAssetSheet,
    TradeableAssetsSheetProps,
} from '../general/TradeableAssetSheet/TradeableAssetSheet';

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
        <TradeableAssetSheet
            assets={filteredData}
            onFilterChange={setFilterValue}
            {...props}
            onSelectedNetworkFilter={setFilterSymbol}
            flashListKey={flashListKey}
        />
    );
};
