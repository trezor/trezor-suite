import { useSelector } from 'react-redux';

import { CommonActions, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetKey,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
} from '@suite-common/assets';
import { Divider, HStack, PressableOpacity, ProgressBar, Text, VStack } from '@suite-native/atoms';
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

import { AssetDetailEarnBalanceRow } from './AssetDetailEarnBalanceRow';

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
    const stakingRatio = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingRatio(state, assetKey),
    );
    const navigation = useNavigation<NavigationProps>();

    if (
        availableAmount === undefined ||
        stakingAmount === undefined ||
        stakingRatio === undefined
    ) {
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
            <PressableOpacity onPress={handlePress} testID="@assets/asset-detail/earn-section">
                <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp20">
                    <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                        <Text variant="body-xs" color="contentSecondary">
                            <Translation id="moduleAssets.assetDetailScreen.earnSection.title" />
                        </Text>
                        <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                    </HStack>

                    <ProgressBar value={stakingRatio} max={1} />

                    <VStack spacing="sp16">
                        <AssetDetailEarnBalanceRow amount={availableAmount} type="available" />
                        <AssetDetailEarnBalanceRow amount={stakingAmount} type="staking" />
                    </VStack>
                </VStack>
            </PressableOpacity>
        </>
    );
};
