import { useCallback } from 'react';

import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetList } from '../components/general/TradeableAssetList/TradeableAssetList';
import { useBuyTradeableAssetsFilteredData } from '../hooks/buy/useBuyTradeableAssetsFilteredData';
import { useExchangeBuyTradeableAssetsFilteredData } from '../hooks/exchange/useExchangeBuyTradeableAssetsFilteredData';

export type TradingTradeableAssetScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingTradeableAsset
>;

type TradeableAssetScreenListProps = {
    onAssetSelect: (asset: TradeableAsset) => void;
};

const BuyTradeableAssetList = ({ onAssetSelect }: TradeableAssetScreenListProps) => {
    const { filteredData, filterSymbol, filterValue, setFilterValue, setFilterSymbol } =
        useBuyTradeableAssetsFilteredData();

    return (
        <TradeableAssetList
            assets={filteredData}
            onAssetSelect={onAssetSelect}
            onFilterChange={setFilterValue}
            onSelectedNetworkFilter={setFilterSymbol}
            selectedNetworkFilter={filterSymbol}
            scrollResetKey={filterValue}
            testID="@trading/buy/receive-asset-screen"
        />
    );
};

const ExchangeTradeableAssetList = ({ onAssetSelect }: TradeableAssetScreenListProps) => {
    const { filteredData, filterSymbol, filterValue, setFilterValue, setFilterSymbol } =
        useExchangeBuyTradeableAssetsFilteredData();

    return (
        <TradeableAssetList
            assets={filteredData}
            onAssetSelect={onAssetSelect}
            onFilterChange={setFilterValue}
            onSelectedNetworkFilter={setFilterSymbol}
            selectedNetworkFilter={filterSymbol}
            scrollResetKey={filterValue}
            testID="@trading/exchange/receive-asset-screen"
        />
    );
};

export const TradingTradeableAssetScreen = ({
    navigation,
    route,
}: TradingTradeableAssetScreenProps) => {
    const { tradingType } = route.params;

    const handleAssetSelect = useCallback(
        ({ cryptoId }: TradeableAsset) => {
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.TradeStack,
                params: {
                    screen: TradingStackRoutes.Trading,
                    params: {
                        tradingType,
                        selectedTradeableAssetCryptoId: cryptoId,
                    },
                },
            });
        },
        [navigation, tradingType],
    );

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    title={<Translation id="moduleTrading.tradeableAssetsSheet.title" />}
                />
            }
            isScrollable={false}
            noBottomPadding
            noHorizontalPadding
            hasBottomInset={false}
        >
            {tradingType === 'buy' && <BuyTradeableAssetList onAssetSelect={handleAssetSelect} />}
            {tradingType === 'exchange' && (
                <ExchangeTradeableAssetList onAssetSelect={handleAssetSelect} />
            )}
        </Screen>
    );
};
