import { useExchangeBuyTradeableAssetsFilteredData } from '../../../hooks/exchange/useExchangeBuyTradeableAssetsFilteredData';
import {
    TradeableAssetSheet,
    TradeableAssetsSheetProps,
} from '../../general/TradeableAssetSheet/TradeableAssetSheet';

export type ExchangeTradeableAssetsSheetProps = Omit<
    TradeableAssetsSheetProps,
    'assets' | 'onFilterChange' | 'onSelectedNetworkFilter' | 'flashListKey'
>;

export const ExchangeTradeableAssetsSheet = (props: ExchangeTradeableAssetsSheetProps) => {
    const { filteredData, filterValue, setFilterValue, setFilterSymbol } =
        useExchangeBuyTradeableAssetsFilteredData();

    // re-mount FlashList component when filterValue changes (resets scroll position)
    const flashListKey = 'exchange_tradeable_assets-' + filterValue;

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
