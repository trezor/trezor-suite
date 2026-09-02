import { useCallback } from 'react';

import { type TradingType } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
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
import { type MyAsset } from '@suite-native/trading-types';

import { MyAssetList, type MyAssetListProps } from '../components/general/MyAssetList/MyAssetList';
import { useMyAssetsFilteredData } from '../hooks/general/useMyAssetsFilteredData';

type TradingMyAssetListProps = {
    onAssetSelect: MyAssetListProps['onAssetSelect'];
    testID?: string;
    tradingType: TradingType;
};

const TradingMyAssetList = ({ onAssetSelect, testID, tradingType }: TradingMyAssetListProps) => {
    const { filteredSections, filterSymbol, scrollResetKey, setFilterSymbol, setFilterValue } =
        useMyAssetsFilteredData(tradingType);

    return (
        <MyAssetList
            assets={filteredSections}
            onAssetSelect={onAssetSelect}
            onFilterChange={setFilterValue}
            onSelectedNetworkFilter={setFilterSymbol}
            scrollResetKey={scrollResetKey}
            selectedNetworkFilter={filterSymbol}
            testID={testID}
        />
    );
};

export type TradingMyAssetScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingMyAsset
>;

export const TradingMyAssetScreen = ({ navigation, route }: TradingMyAssetScreenProps) => {
    const { tradingType } = route.params;

    const handleAssetSelect = useCallback(
        (asset: MyAsset, account: Account) => {
            if (!asset.isEnabled || !asset.cryptoId) {
                return;
            }

            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.TradeStack,
                params: {
                    screen: TradingStackRoutes.Trading,
                    params: {
                        tradingType,
                        selectedMyAssetAccountKey: account.key,
                        selectedMyAssetCryptoId: asset.cryptoId,
                    },
                },
            });
        },
        [navigation, tradingType],
    );

    const testID = `@trading/${tradingType}/send-asset-screen`;

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    title={<Translation id="moduleTrading.myAssetScreen.title" />}
                />
            }
            isScrollable={false}
            noBottomPadding
            noHorizontalPadding
            hasBottomInset={false}
        >
            <TradingMyAssetList
                onAssetSelect={handleAssetSelect}
                testID={testID}
                tradingType={tradingType}
            />
        </Screen>
    );
};
