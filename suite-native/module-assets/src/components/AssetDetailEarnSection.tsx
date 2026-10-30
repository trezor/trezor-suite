import { useSelector } from 'react-redux';

import { CommonActions, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetEarnState,
    type HomeAssetTableState,
    selectIsWalletAssetEarnAvailable,
    selectWalletAssetAvailableAmount,
    selectWalletAssetKey,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
import { Divider, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type AssetsStackParamList,
    type AssetsStackRoutes,
    EarnStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { AssetDetailEarnBalanceBar } from './AssetDetailEarnBalanceBar';
import { AssetDetailEarnBalanceRow } from './AssetDetailEarnBalanceRow';
import { AssetDetailEarnBanner } from './AssetDetailEarnBanner';
import { AssetDetailSectionHeader } from './AssetDetailSectionHeader';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>;

export const AssetDetailEarnSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const availableAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAvailableAmount(state, assetKey),
    );
    const stakingAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingAmount(state, assetKey),
    );
    const isEarnAvailable = useSelector((state: HomeAssetEarnState) =>
        selectIsWalletAssetEarnAvailable(state, assetKey),
    );
    const navigation = useNavigation<NavigationProps>();

    if (availableAmount === undefined || stakingAmount === undefined || !isEarnAvailable) {
        return null;
    }

    // Reset to a single AppTabs route instead of stacking another navigator or presenting Earn
    // with a back transition.
    const handlePress = () =>
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: AppTabsRoutes.EarnStack,
                            params: { screen: EarnStackRoutes.Earn },
                        },
                    },
                ],
            }),
        );

    return (
        <>
            <Divider />
            <VStack paddingHorizontal="sp20" spacing="sp12">
                <AssetDetailSectionHeader
                    title={<Translation id="moduleAssets.assetDetailScreen.earnSection.title" />}
                    linkLabel={
                        <Translation id="moduleAssets.assetDetailScreen.earnSection.viewAll" />
                    }
                    onPress={handlePress}
                    testID="@assets/asset-detail/earn-view-all-button"
                />

                <AssetDetailEarnBalanceBar assetKey={assetKey} />
                <AssetDetailEarnBalanceRow amount={availableAmount} type="available" />
                <AssetDetailEarnBalanceRow amount={stakingAmount} type="staking" />
                <AssetDetailEarnBanner
                    availableAmount={availableAmount}
                    stakingAmount={stakingAmount}
                    onPress={handlePress}
                />
            </VStack>
        </>
    );
};
