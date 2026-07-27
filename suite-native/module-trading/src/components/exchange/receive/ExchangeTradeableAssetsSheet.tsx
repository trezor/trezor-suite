import { useExchangeBuyTradeableAssetsFilteredData } from '../../../hooks/exchange/useExchangeBuyTradeableAssetsFilteredData';
import {
    TradeableAssetSheet,
    type TradeableAssetsSheetProps,
} from '../../general/TradeableAssetSheet/TradeableAssetSheet';

export type ExchangeTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter' | 'scrollResetKey'
>;

const SHEET_TEST_ID = '@trading/exchange/receive-asset-sheet';

export const ExchangeTradeableAssetsSheet = (props: ExchangeTradeableAssetsSheetProps) => {
    const { filteredData, filterValue, setFilterValue, setFilterSymbol } =
        useExchangeBuyTradeableAssetsFilteredData();

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
