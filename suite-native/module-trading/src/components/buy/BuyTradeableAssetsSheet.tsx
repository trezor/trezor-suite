import { useBuyTradeableAssetsFilteredData } from '../../hooks/buy/useBuyTradeableAssetsFilteredData';
import {
    TradeableAssetSheet,
    type TradeableAssetsSheetProps,
} from '../general/TradeableAssetSheet/TradeableAssetSheet';

export type BuyTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter' | 'flashListKey'
>;

const SHEET_TEST_ID = '@trading/buy/receive-asset-sheet';

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
            testID={SHEET_TEST_ID}
        />
    );
};
