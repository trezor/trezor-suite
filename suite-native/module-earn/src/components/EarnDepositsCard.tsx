import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    Box,
    Card,
    ListItemSkeleton,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useEarnDepositsCardData } from '../hooks/useEarnDepositsCardData';
import { useStakingDetailNavigation } from '../hooks/useStakingDetailNavigation';
import {
    type StablecoinYieldClaimSummary,
    type StablecoinYieldEarnItem,
    type StakingEarnItem,
} from '../types';
import { EarnActiveItemsBottomSheet } from './EarnActiveItemsBottomSheet';
import { EarnDepositsCardRow } from './EarnDepositsCardRow';
import { StablecoinYieldClaimRewardsBottomSheet } from './StablecoinYieldClaimRewardsBottomSheet';
import { StablecoinYieldClaimRewardsCardSection } from './StablecoinYieldClaimRewardsCardSection';

const cardHeaderStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>;

type EarnDepositsCardProps = {
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: StablecoinYieldEarnItem[];
    stablecoinYieldClaimSummaries: StablecoinYieldClaimSummary[];
    stablecoinYieldTotalFiatClaimableAmount: BaseCurrencyAmount | null;
    isStablecoinYieldLoading: boolean;
    isStablecoinYieldClaimSummariesLoading: boolean;
};

export const EarnDepositsCard = ({
    stakingActiveItems,
    stablecoinYieldActiveItems,
    stablecoinYieldClaimSummaries,
    stablecoinYieldTotalFiatClaimableAmount,
    isStablecoinYieldLoading,
    isStablecoinYieldClaimSummariesLoading,
}: EarnDepositsCardProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { stakingRow, stablecoinYieldRow, totalDepositedFiatAmount } = useEarnDepositsCardData({
        stakingActiveItems,
        stablecoinYieldActiveItems,
    });
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const {
        bottomSheetRef: stakingSheetRef,
        closeModal: closeStakingSheet,
        openModal: openStakingSheet,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: stablecoinYieldSheetRef,
        closeModal: closeStablecoinYieldSheet,
        openModal: openStablecoinYieldSheet,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: stablecoinYieldClaimRewardsSheetRef,
        closeModal: closeStablecoinYieldClaimRewardsSheet,
        openModal: openStablecoinYieldClaimRewardsSheet,
    } = useBottomSheetModal();

    const handleStablecoinYieldClaimRewardPress = useCallback(
        ({ accountKey }: StablecoinYieldClaimSummary) => {
            navigation.navigate(RootStackRoutes.YieldNavigator, {
                screen: YieldStackRoutes.YieldClaim,
                params: { accountKey },
            });
        },
        [navigation],
    );

    const handleStablecoinYieldClaimRewardsPress = useCallback(() => {
        if (stablecoinYieldClaimSummaries.length === 1) {
            const claimReward = stablecoinYieldClaimSummaries[0];

            if (claimReward) {
                handleStablecoinYieldClaimRewardPress(claimReward);
            }

            return;
        }

        openStablecoinYieldClaimRewardsSheet();
    }, [
        handleStablecoinYieldClaimRewardPress,
        openStablecoinYieldClaimRewardsSheet,
        stablecoinYieldClaimSummaries,
    ]);

    return (
        <>
            <Box marginBottom="sp32">
                <Card borderColor="borderNeutral" noPadding testID="@earn/deposits-card">
                    <Box style={applyStyle(cardHeaderStyle)}>
                        <VStack spacing="sp24">
                            <VStack spacing={2}>
                                <Text variant="body-md" color="contentSecondary">
                                    <Translation id="earn.earnScreen.depositsCard.title" />
                                </Text>
                                <BaseCurrencyAmountFormatter
                                    value={totalDepositedFiatAmount}
                                    variant="headline-md"
                                    isDiscreetText={false}
                                />
                            </VStack>

                            <StablecoinYieldClaimRewardsCardSection
                                claimRewards={stablecoinYieldClaimSummaries}
                                totalFiatClaimableAmount={stablecoinYieldTotalFiatClaimableAmount}
                                isLoading={isStablecoinYieldClaimSummariesLoading}
                                onPress={handleStablecoinYieldClaimRewardsPress}
                            />
                        </VStack>
                    </Box>

                    {stakingRow && (
                        <EarnDepositsCardRow
                            key={stakingRow.type}
                            row={stakingRow}
                            onPress={openStakingSheet}
                        />
                    )}

                    {stablecoinYieldRow && (
                        <EarnDepositsCardRow
                            key={stablecoinYieldRow.type}
                            row={stablecoinYieldRow}
                            onPress={openStablecoinYieldSheet}
                        />
                    )}
                    {isStablecoinYieldLoading && <ListItemSkeleton />}
                </Card>
            </Box>

            <EarnActiveItemsBottomSheet
                ref={stakingSheetRef}
                type="staking"
                items={stakingRow?.activeItems ?? []}
                navigateToStakingDetail={navigateToStakingDetail}
                onClose={closeStakingSheet}
            />
            <EarnActiveItemsBottomSheet
                ref={stablecoinYieldSheetRef}
                type="stablecoin-yield"
                items={stablecoinYieldRow?.activeItems ?? []}
                navigateToStakingDetail={navigateToStakingDetail}
                onClose={closeStablecoinYieldSheet}
            />

            <StablecoinYieldClaimRewardsBottomSheet
                ref={stablecoinYieldClaimRewardsSheetRef}
                claimRewards={stablecoinYieldClaimSummaries}
                onClaimRewardPress={handleStablecoinYieldClaimRewardPress}
                onClose={closeStablecoinYieldClaimRewardsSheet}
            />
        </>
    );
};
