import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type TradingRootState, selectTradingCoinInfoByCryptoId } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { type SectionListData, coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { type MyAsset, type TradeableAsset } from '@suite-native/trading-types';

type MyAssetPickerTradingType = RootStackParamList[RootStackRoutes.TradingMyAsset]['tradingType'];

type UseMyAssetPickerNavigationProps = {
    assets: SectionListData<MyAsset, Account>;
    onAssetSelect: (asset: TradeableAsset, account: Account) => void;
    tradingType: MyAssetPickerTradingType;
};

type NavigationProp = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

export const useMyAssetPickerNavigation = ({
    assets,
    onAssetSelect,
    tradingType,
}: UseMyAssetPickerNavigationProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { params } = useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.Trading>>();
    const routeTradingType = params?.tradingType;
    const selectedMyAssetAccountKey = params?.selectedMyAssetAccountKey;
    const selectedMyAssetCryptoId = params?.selectedMyAssetCryptoId;
    const accountSection = useMemo(
        () => assets.find(section => section.sectionData.key === selectedMyAssetAccountKey),
        [assets, selectedMyAssetAccountKey],
    );
    const selectedAsset = useMemo(
        () =>
            accountSection?.data.find(
                asset => asset.isEnabled && asset.cryptoId === selectedMyAssetCryptoId,
            ),
        [accountSection, selectedMyAssetCryptoId],
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, selectedAsset?.cryptoId),
    );

    useEffect(() => {
        if (
            !selectedMyAssetAccountKey ||
            !selectedMyAssetCryptoId ||
            routeTradingType !== tradingType
        ) {
            return;
        }

        const tradeableAsset =
            selectedAsset?.cryptoId && coinInfo
                ? coinInfoToTradeableAsset(selectedAsset.cryptoId, coinInfo)
                : undefined;

        if (!accountSection || !tradeableAsset) {
            return;
        }

        navigation.setParams({
            selectedMyAssetAccountKey: undefined,
            selectedMyAssetCryptoId: undefined,
        });
        onAssetSelect(tradeableAsset, accountSection.sectionData);
    }, [
        accountSection,
        coinInfo,
        navigation,
        onAssetSelect,
        routeTradingType,
        selectedMyAssetAccountKey,
        selectedMyAssetCryptoId,
        selectedAsset,
        tradingType,
    ]);

    return useCallback(
        () => navigation.navigate(RootStackRoutes.TradingMyAsset, { tradingType }),
        [navigation, tradingType],
    );
};
