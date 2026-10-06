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
import {
    selectBuyTradeableAssets,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetList } from '../components/general/TradeableAssetList/TradeableAssetList';
import { useTradingTradeableAssetsFilteredData } from '../hooks/general/useTradingTradeableAssetsFilteredData';

export type TradingTradeableAssetScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingTradeableAsset
>;

type TradeableAssetScreenListProps = {
    onAssetSelect: (asset: TradeableAsset) => void;
};

const BuyTradeableAssetList = ({ onAssetSelect }: TradeableAssetScreenListProps) => {
    const {
        filteredData,
        filterSymbol,
        filterValue,
        setFilterValue,
        setFilterSymbol,
        assetBalances,
    } = useTradingTradeableAssetsFilteredData(selectBuyTradeableAssets);

    return (
        <TradeableAssetList
            assets={filteredData}
            onAssetSelect={onAssetSelect}
            onFilterChange={setFilterValue}
            onSelectedNetworkFilter={setFilterSymbol}
            selectedNetworkFilter={filterSymbol}
            scrollResetKey={filterValue}
            assetBalances={assetBalances}
            testID="@trading/buy/receive-asset-screen"
        />
    );
};

const ExchangeTradeableAssetList = ({ onAssetSelect }: TradeableAssetScreenListProps) => {
    const {
        filteredData,
        filterSymbol,
        filterValue,
        setFilterValue,
        setFilterSymbol,
        assetBalances,
    } = useTradingTradeableAssetsFilteredData(selectExchangeBuyTradeableAssets);

    return (
        <TradeableAssetList
            assets={filteredData}
            onAssetSelect={onAssetSelect}
            onFilterChange={setFilterValue}
            onSelectedNetworkFilter={setFilterSymbol}
            selectedNetworkFilter={filterSymbol}
            scrollResetKey={filterValue}
            assetBalances={assetBalances}
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
                    title={<Translation id="moduleTrading.selectCoin.title" />}
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
