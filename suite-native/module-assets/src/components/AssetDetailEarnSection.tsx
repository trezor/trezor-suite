import { useSelector } from 'react-redux';

import { CommonActions, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetEarnState,
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetEarnAvailable,
    selectWalletAssetKey,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
import { Divider, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
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
        selectWalletAssetEarnAvailable(state, assetKey),
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
            <VStack paddingHorizontal="sp20" paddingVertical="sp20" spacing="sp12">
                <VStack spacing="sp12">
                    <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                        <Text variant="body-xs" color="contentSecondary">
                            <Translation id="moduleAssets.assetDetailScreen.earnSection.title" />
                        </Text>
                        <PressableOpacity
                            accessibilityRole="button"
                            onPress={handlePress}
                            testID="@assets/asset-detail/earn-section"
                        >
                            <HStack alignItems="center" spacing="sp4">
                                <Text variant="body-xs" color="contentBrand">
                                    <Translation id="moduleAssets.assetDetailScreen.earnSection.viewAll" />
                                </Text>
                                <Icon name="caretRight" size="small" color="contentBrand" />
                            </HStack>
                        </PressableOpacity>
                    </HStack>

                    <AssetDetailEarnBalanceBar />
                </VStack>

                <VStack spacing="sp12">
                    <AssetDetailEarnBalanceRow amount={availableAmount} type="available" />
                    <AssetDetailEarnBalanceRow amount={stakingAmount} type="staking" />
                    <AssetDetailEarnBanner onPress={handlePress} />
                </VStack>
            </VStack>
        </>
    );
};
