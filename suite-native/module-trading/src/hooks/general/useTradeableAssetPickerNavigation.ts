import { useCallback, useEffect } from 'react';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { type TradeableAsset } from '@suite-native/trading-types';

type TradeableAssetPickerTradingType =
    RootStackParamList[RootStackRoutes.TradingTradeableAsset]['tradingType'];

type UseTradeableAssetPickerNavigationProps = {
    assets: TradeableAsset[];
    onAssetSelect: (asset: TradeableAsset) => void;
    tradingType: TradeableAssetPickerTradingType;
};

type NavigationProp = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

export const useTradeableAssetPickerNavigation = ({
    assets,
    onAssetSelect,
    tradingType,
}: UseTradeableAssetPickerNavigationProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { params } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.Trading>>();
    const routeTradingType = params?.tradingType;
    const selectedTradeableAssetCryptoId = params?.selectedTradeableAssetCryptoId;

    useEffect(() => {
        if (!selectedTradeableAssetCryptoId || routeTradingType !== tradingType) {
            return;
        }

        const selectedAsset = assets.find(
            asset => asset.cryptoId === selectedTradeableAssetCryptoId,
        );

        if (!selectedAsset) {
            return;
        }

        navigation.setParams({ selectedTradeableAssetCryptoId: undefined });
        onAssetSelect(selectedAsset);
    }, [
        assets,
        navigation,
        onAssetSelect,
        routeTradingType,
        selectedTradeableAssetCryptoId,
        tradingType,
    ]);

    return useCallback(
        () => navigation.navigate(RootStackRoutes.TradingTradeableAsset, { tradingType }),
        [navigation, tradingType],
    );
};
