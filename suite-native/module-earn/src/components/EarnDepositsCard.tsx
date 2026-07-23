import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    Box,
    Card,
    HStack,
    InlineAlertBox,
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
import { useStablecoinYieldFirmwareUpdateAlert } from '../hooks/useStablecoinYieldFirmwareUpdateAlert';
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
    const {
        stakingRow,
        stablecoinYieldRow,
        totalDepositedFiatAmount,
        isFiatRatesLoading,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        retryMissingFiatRates,
    } = useEarnDepositsCardData({
        stakingActiveItems,
        stablecoinYieldActiveItems,
    });
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const { isFirmwareSupported, showFirmwareUpdateAlert } =
        useStablecoinYieldFirmwareUpdateAlert();
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

    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleStablecoinYieldClaimRewardPress = useCallback(
        ({ accountKey, networkSymbol }: StablecoinYieldClaimSummary) => {
            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'claim-form',
                    networkSymbol,
                },
            });
            navigation.navigate(RootStackRoutes.YieldNavigator, {
                screen: YieldStackRoutes.YieldClaim,
                params: { accountKey },
            });
        },
        [analytics, navigation],
    );

    const handleStablecoinYieldClaimRewardsPress = useCallback(() => {
        if (!isFirmwareSupported('claim')) {
            showFirmwareUpdateAlert();

            return;
        }

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
        isFirmwareSupported,
        openStablecoinYieldClaimRewardsSheet,
        showFirmwareUpdateAlert,
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
                                {isFiatTotalUnavailable ? (
                                    <Text variant="headline-md">
                                        <Translation id="earn.notAvailableShort" />
                                    </Text>
                                ) : (
                                    <HStack spacing="sp4" alignItems="center">
                                        {isFiatTotalIncomplete && (
                                            <Text variant="headline-md">~</Text>
                                        )}
                                        <BaseCurrencyAmountFormatter
                                            value={totalDepositedFiatAmount}
                                            variant="headline-md"
                                            isDiscreetText={false}
                                            isLoading={isFiatRatesLoading}
                                        />
                                    </HStack>
                                )}
                            </VStack>

                            {isFiatTotalIncomplete && (
                                <InlineAlertBox
                                    testID="@earn/deposits-card/incomplete-fiat-total"
                                    intent="warning"
                                    title={
                                        <Translation id="earn.earnScreen.depositsCard.incompleteFiatTotal" />
                                    }
                                    buttonLabel={<Translation id="generic.buttons.retry" />}
                                    buttonProps={{ priority: 'secondary' }}
                                    onButtonPress={() => void retryMissingFiatRates()}
                                />
                            )}

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
