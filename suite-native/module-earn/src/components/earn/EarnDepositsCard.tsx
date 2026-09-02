import { useCallback, useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Card, Divider, ListItemSkeleton, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { EarnActiveItemsBottomSheet } from './EarnActiveItemsBottomSheet';
import { EarnBalanceCard } from './EarnBalanceCard';
import { EarnDepositsCardRow } from './EarnDepositsCardRow';
import { useEarnDepositsCardData } from '../../hooks/earn/useEarnDepositsCardData';
import { useStakingDetailNavigation } from '../../hooks/staking/useStakingDetailNavigation';
import { useStakingNavigateAnalytics } from '../../hooks/staking/useStakingNavigateAnalytics';
import { useStablecoinYieldFirmwareUpdateAlert } from '../../hooks/yield/useStablecoinYieldFirmwareUpdateAlert';
import type { StakingEarnItem, YieldClaimSummary, YieldEarnItem } from '../../types';
import {
    type StablecoinYieldClaimItem,
    buildStablecoinYieldClaimItems,
} from '../../utils/yield/stablecoinYieldClaimSummaryUtils';
import { YieldClaimRewardsBottomSheet } from '../yield/YieldClaimRewardsBottomSheet';
import { YieldClaimRewardsCardSection } from '../yield/YieldClaimRewardsCardSection';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>;

type EarnDepositsCardProps = {
    stakingActiveItems: StakingEarnItem[];
    stablecoinYieldActiveItems: YieldEarnItem[];
    stablecoinYieldClaimSummaries: YieldClaimSummary[];
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
    const navigation = useNavigation<NavigationProp>();
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const {
        stakingRow,
        stablecoinYieldRow,
        totalDepositedFiatAmount,
        stakingFiatAmount,
        stablecoinYieldFiatAmount,
        isFiatRatesLoading,
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        retryMissingFiatRates,
    } = useEarnDepositsCardData({
        stakingActiveItems,
        stablecoinYieldActiveItems,
    });
    const reportStakingNavigate = useStakingNavigateAnalytics();
    const store = useStore<AccountsRootState>();
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

    const shouldShowClaimRewardsSection =
        !isPortfolioTrackerDevice &&
        (stablecoinYieldClaimSummaries.length > 0 || isStablecoinYieldClaimSummariesLoading);
    const shouldShowStablecoinYieldCard =
        stablecoinYieldRow !== null || shouldShowClaimRewardsSection || isStablecoinYieldLoading;

    const stablecoinYieldClaimItems = useMemo(
        () =>
            buildStablecoinYieldClaimItems({
                stablecoinYieldClaimSummaries,
                earnDepositsActiveItems: stablecoinYieldRow?.activeItems ?? [],
            }),
        [stablecoinYieldClaimSummaries, stablecoinYieldRow?.activeItems],
    );

    const handleStablecoinYieldClaimRewardPress = useCallback(
        ({ summary, vaults }: StablecoinYieldClaimItem) => {
            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'earn-dashboard',
                    to: 'claim-form',
                    networkSymbol: summary.networkSymbol,
                },
            });
            navigation.navigate(RootStackRoutes.YieldNavigator, {
                screen: YieldStackRoutes.YieldClaim,
                params: {
                    accountKey: summary.accountKey,
                    vault: vaults.length === 1 ? vaults[0] : undefined,
                },
            });
        },
        [analytics, navigation],
    );

    const handleStakingRowPress = useCallback(() => {
        const activeItems = stakingRow?.activeItems ?? [];

        if (activeItems.length === 1) {
            const onlyItem = activeItems[0];

            if (onlyItem?.type === 'staking') {
                const account = selectAccountByKey(store.getState(), onlyItem.accountKey);
                if (account) {
                    reportStakingNavigate(account);
                }
                navigateToStakingDetail({
                    accountKey: onlyItem.accountKey,
                    symbol: onlyItem.symbol,
                });
            }

            return;
        }

        openStakingSheet();
    }, [navigateToStakingDetail, openStakingSheet, reportStakingNavigate, stakingRow, store]);

    const handleStablecoinYieldClaimRewardsPress = useCallback(() => {
        if (!isFirmwareSupported('claim')) {
            showFirmwareUpdateAlert();

            return;
        }

        if (stablecoinYieldClaimItems.length === 1) {
            const claimItem = stablecoinYieldClaimItems[0];

            if (claimItem) {
                handleStablecoinYieldClaimRewardPress(claimItem);
            }

            return;
        }

        openStablecoinYieldClaimRewardsSheet();
    }, [
        handleStablecoinYieldClaimRewardPress,
        isFirmwareSupported,
        openStablecoinYieldClaimRewardsSheet,
        showFirmwareUpdateAlert,
        stablecoinYieldClaimItems,
    ]);

    return (
        <>
            <VStack spacing="sp16" marginBottom="sp32">
                <EarnBalanceCard
                    totalFiatAmount={totalDepositedFiatAmount}
                    stakingFiatAmount={stakingFiatAmount}
                    stablecoinYieldFiatAmount={stablecoinYieldFiatAmount}
                    isFiatRatesLoading={isFiatRatesLoading}
                    isFiatTotalIncomplete={isFiatTotalIncomplete}
                    isFiatTotalUnavailable={isFiatTotalUnavailable}
                    shouldShowBreakdown={stakingRow !== null && stablecoinYieldRow !== null}
                    onRetryMissingFiatRates={() => void retryMissingFiatRates()}
                />

                {stakingRow && (
                    <Card borderColor="borderNeutral" noPadding testID="@earn/staking-card">
                        <EarnDepositsCardRow row={stakingRow} onPress={handleStakingRowPress} />
                    </Card>
                )}

                {shouldShowStablecoinYieldCard && (
                    <Card borderColor="borderNeutral" noPadding testID="@earn/defi-yield-card">
                        {stablecoinYieldRow && (
                            <EarnDepositsCardRow
                                row={stablecoinYieldRow}
                                onPress={openStablecoinYieldSheet}
                            />
                        )}
                        {isStablecoinYieldLoading && !stablecoinYieldRow && <ListItemSkeleton />}
                        {shouldShowClaimRewardsSection && (
                            <>
                                {(stablecoinYieldRow !== null || isStablecoinYieldLoading) && (
                                    <Divider />
                                )}
                                <YieldClaimRewardsCardSection
                                    claimRewards={stablecoinYieldClaimSummaries}
                                    totalFiatClaimableAmount={
                                        stablecoinYieldTotalFiatClaimableAmount
                                    }
                                    isLoading={isStablecoinYieldClaimSummariesLoading}
                                    onPress={handleStablecoinYieldClaimRewardsPress}
                                />
                            </>
                        )}
                    </Card>
                )}
            </VStack>

            <EarnActiveItemsBottomSheet
                ref={stakingSheetRef}
                type="staking"
                items={stakingRow?.activeItems ?? []}
                onClose={closeStakingSheet}
            />

            <EarnActiveItemsBottomSheet
                ref={stablecoinYieldSheetRef}
                type="stablecoin-yield"
                items={stablecoinYieldRow?.activeItems ?? []}
                onClose={closeStablecoinYieldSheet}
            />

            <YieldClaimRewardsBottomSheet
                ref={stablecoinYieldClaimRewardsSheetRef}
                claimItems={stablecoinYieldClaimItems}
                onClaimRewardPress={handleStablecoinYieldClaimRewardPress}
                onClose={closeStablecoinYieldClaimRewardsSheet}
            />
        </>
    );
};
