import { useBuyTradeableAssetsFilteredData } from '../../hooks/buy/useBuyTradeableAssetsFilteredData';
import {
    TradeableAssetSheet,
    type TradeableAssetsSheetProps,
} from '../general/TradeableAssetSheet/TradeableAssetSheet';

export type BuyTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter' | 'scrollResetKey'
>;

const SHEET_TEST_ID = '@trading/buy/receive-asset-sheet';

export const BuyTradeableAssetsSheet = (props: BuyTradeableAssetsSheetProps) => {
    const { filteredData, filterValue, setFilterValue, setFilterSymbol } =
        useBuyTradeableAssetsFilteredData();

    return (
        <TradeableAssetSheet
            assets={filteredData}
            onFilterChange={setFilterValue}
            {...props}
            onSelectedNetworkFilter={setFilterSymbol}
            // reset scroll position when filterValue changes
            scrollResetKey={filterValue}
            testID={SHEET_TEST_ID}
        />
    );
};
