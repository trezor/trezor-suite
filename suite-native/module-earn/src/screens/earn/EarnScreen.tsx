import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { EarnDashboardDisabledRow } from '../../components/earn/EarnDashboardDisabledRow';
import { EarnItemInfoModal } from '../../components/earn/EarnItemInfoModal';
import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { EarnPoweredByProvider } from '../../components/earn/EarnPoweredByProvider';
import { EarnPromoListHeader } from '../../components/earn/EarnPromoListHeader';
import {
    EarnPromoListRow,
    EarnPromoListRowContainer,
    EarnPromoListSkeletonRow,
} from '../../components/earn/EarnPromoListRow';
import { EarnScreenListHeader } from '../../components/earn/EarnScreenListHeader';
import { EarnStakingProvidersInfo } from '../../components/earn/EarnStakingProvidersInfo';
import { EnableNetworkForEarnBottomSheet } from '../../components/earn/EnableNetworkForEarnBottomSheet';
import { ChooseStakingAccountBottomSheet } from '../../components/staking/ChooseStakingAccountBottomSheet';
import { YieldLoadErrorAlert } from '../../components/yield/YieldLoadErrorAlert';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useStakingListData } from '../../hooks/staking/useStakingListData';
import { useStakingPromoNavigation } from '../../hooks/staking/useStakingPromoNavigation';
import { useStablecoinYieldListData } from '../../hooks/yield/useStablecoinYieldListData';
import { useStablecoinYieldPromoNavigation } from '../../hooks/yield/useStablecoinYieldPromoNavigation';
import {
    type EarnDashboardDisabledListItem,
    type EarnPromoItem,
    type EarnPromoListDataItem,
} from '../../types';

const STAKING_DASHBOARD_DISABLED_ITEM = {
    id: 'staking-dashboard-disabled',
    type: 'dashboard-disabled',
    dashboardType: 'staking',
} as const satisfies EarnDashboardDisabledListItem;

const YIELD_DASHBOARD_DISABLED_ITEM = {
    id: 'yield-dashboard-disabled',
    type: 'dashboard-disabled',
    dashboardType: 'yield',
} as const satisfies EarnDashboardDisabledListItem;

const getEarnListItemType = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? 'section-header' : `row-${item.type}`;

const getEarnListItemKey = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? item : item.id;

const isSectionBoundaryItem = (item: EarnPromoListDataItem | undefined) =>
    item === undefined ||
    typeof item === 'string' ||
    item.type === 'provider' ||
    item.type === 'staking-providers-info';

const EarnScreenContent = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const {
        promoListData: stakingPromoItems,
        activeItems: stakingActiveItems,
        accountStakedWithFiveBinaries,
    } = useStakingListData();
    const {
        promoListData: stablecoinYieldPromoItems,
        activeItems: stablecoinYieldActiveItems,
        stablecoinYieldClaimSummaries,
        totalFiatClaimableAmount: stablecoinYieldTotalFiatClaimableAmount,
        isLoading: isYieldLoading,
        isClaimSummariesLoading,
        retryLoadStablecoinYield,
    } = useStablecoinYieldListData();

    const staking = useStakingPromoNavigation();
    const stablecoinYield = useStablecoinYieldPromoNavigation();
    const { handleStakingPromoPress } = staking;
    const { handleStablecoinYieldPromoPress } = stablecoinYield;

    const stakingDashboard = useMessageSystemEarnDashboard('staking');
    const yieldDashboard = useMessageSystemEarnDashboard('yield');
    const isStakingDashboardDisabled = stakingDashboard.isDisabled;
    const isYieldDashboardDisabled = yieldDashboard.isDisabled;

    const earnListData = useMemo((): EarnPromoListDataItem[] => {
        const stakingItems: EarnPromoListDataItem[] = isStakingDashboardDisabled
            ? ['staking', STAKING_DASHBOARD_DISABLED_ITEM]
            : stakingPromoItems;
        const stablecoinYieldItems: EarnPromoListDataItem[] = isYieldDashboardDisabled
            ? ['stablecoin-yield', YIELD_DASHBOARD_DISABLED_ITEM]
            : stablecoinYieldPromoItems;

        return [...stakingItems, ...stablecoinYieldItems];
    }, [
        isStakingDashboardDisabled,
        isYieldDashboardDisabled,
        stablecoinYieldPromoItems,
        stakingPromoItems,
    ]);

    useFocusEffect(
        useCallback(() => {
            analytics.report({ type: events.earnNavigateEvent.name });
        }, [analytics]),
    );

    const hasReportedYieldDashboardReadyRef = useRef(false);

    useEffect(() => {
        if (
            hasReportedYieldDashboardReadyRef.current ||
            isYieldLoading ||
            isClaimSummariesLoading
        ) {
            return;
        }

        hasReportedYieldDashboardReadyRef.current = true;
        analytics.report({
            type: sharedEvents.yieldEarnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner: stablecoinYieldClaimSummaries.length > 0,
                hasActivePosition: stablecoinYieldActiveItems.length > 0,
                availableVaultCount: stablecoinYieldPromoItems.filter(
                    item => typeof item !== 'string' && item.type === 'stablecoin-yield',
                ).length,
            },
        });
    }, [
        analytics,
        isClaimSummariesLoading,
        isYieldLoading,
        stablecoinYieldActiveItems.length,
        stablecoinYieldClaimSummaries.length,
        stablecoinYieldPromoItems,
    ]);

    const handlePromoItemPress = useCallback(
        (item: EarnPromoItem) => {
            if (item.type === 'stablecoin-yield') {
                analytics.report({
                    type: events.earnStablecoinYieldTilePressedEvent.name,
                });

                handleStablecoinYieldPromoPress(item);

                return;
            }

            analytics.report({
                type: events.earnStakeTilePressedEvent.name,
            });

            handleStakingPromoPress(item);
        },
        [analytics, handleStablecoinYieldPromoPress, handleStakingPromoPress],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: EarnPromoListDataItem; index: number }) => {
            if (typeof item === 'string') {
                return <EarnPromoListHeader item={item} />;
            }

            if (item.type === 'provider') {
                return <EarnPoweredByProvider provider={item.provider} />;
            }

            if (item.type === 'staking-providers-info') {
                return <EarnStakingProvidersInfo />;
            }

            const nextItem = earnListData[index + 1];
            const isLastInSection = isSectionBoundaryItem(nextItem);

            if (item.type === 'skeleton-loader') {
                return <EarnPromoListSkeletonRow isLastInSection={isLastInSection} />;
            }

            if (item.type === 'dashboard-disabled') {
                return (
                    <EarnDashboardDisabledRow
                        type={item.dashboardType}
                        isLastInSection={isLastInSection}
                    />
                );
            }

            if (item.type === 'stablecoin-yield-load-error') {
                return (
                    <EarnPromoListRowContainer isLastInSection={isLastInSection}>
                        <YieldLoadErrorAlert onRetry={retryLoadStablecoinYield} />
                    </EarnPromoListRowContainer>
                );
            }

            return (
                <EarnPromoListRow
                    item={item}
                    isLastInSection={isLastInSection}
                    onPress={handlePromoItemPress}
                />
            );
        },
        [earnListData, handlePromoItemPress, retryLoadStablecoinYield],
    );

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp32">
                <FlashList
                    data={earnListData}
                    getItemType={getEarnListItemType}
                    ListHeaderComponent={
                        <>
                            <ContextMessage
                                context={Context.getEarnDashboard('staking')}
                                marginBottom="sp16"
                            />
                            <ContextMessage
                                context={Context.getEarnDashboard('yield')}
                                marginBottom="sp16"
                            />
                            <EarnScreenListHeader
                                isStablecoinYieldLoading={
                                    !isYieldDashboardDisabled && isYieldLoading
                                }
                                isStablecoinYieldClaimSummariesLoading={
                                    !isYieldDashboardDisabled && isClaimSummariesLoading
                                }
                                cardanoStakingAccountKey={
                                    isStakingDashboardDisabled
                                        ? undefined
                                        : accountStakedWithFiveBinaries?.key
                                }
                                stakingActiveItems={
                                    isStakingDashboardDisabled ? [] : stakingActiveItems
                                }
                                stablecoinYieldActiveItems={
                                    isYieldDashboardDisabled ? [] : stablecoinYieldActiveItems
                                }
                                stablecoinYieldClaimSummaries={
                                    isYieldDashboardDisabled ? [] : stablecoinYieldClaimSummaries
                                }
                                stablecoinYieldTotalFiatClaimableAmount={
                                    isYieldDashboardDisabled
                                        ? null
                                        : stablecoinYieldTotalFiatClaimableAmount
                                }
                            />
                        </>
                    }
                    keyExtractor={getEarnListItemKey}
                    renderItem={renderItem}
                />

                <EarnItemInfoModal ref={staking.infoSheetRef} type="staking" />
                <ChooseStakingAccountBottomSheet
                    ref={staking.chooseAccountSheetRef}
                    accounts={staking.chosenAccounts}
                    onAccountSelected={staking.handleAccountSelected}
                    onClose={staking.closeChooseAccountModal}
                    onDismiss={staking.handleChooseAccountDismiss}
                />
                <EnableNetworkForEarnBottomSheet
                    ref={staking.enableNetworkSheetRef}
                    symbol={staking.pendingEnableSymbol}
                    onEnablePress={staking.handleEnableNetworkPress}
                    onDismiss={staking.handleEnableNetworkDismiss}
                />
                <ChooseStakingAccountBottomSheet
                    ref={stablecoinYield.chooseAccountSheetRef}
                    accounts={stablecoinYield.chosenAccounts}
                    onAccountSelected={stablecoinYield.handleAccountSelected}
                    onClose={stablecoinYield.closeChooseAccountModal}
                    onDismiss={stablecoinYield.handleChooseAccountDismiss}
                    tokenBalance={stablecoinYield.chooseAccountTokenBalance}
                />
                <EnableNetworkForEarnBottomSheet
                    ref={stablecoinYield.enableNetworkSheetRef}
                    symbol={stablecoinYield.pendingEnableSymbol}
                    type="stablecoin-yield"
                    onEnablePress={stablecoinYield.handleEnableNetworkPress}
                    onDismiss={stablecoinYield.handleEnableNetworkDismiss}
                />
            </VStack>
        </Screen>
    );
};

export const EarnScreen = () => (
    <EarnPortfolioTrackerGuard>
        <EarnScreenContent />
    </EarnPortfolioTrackerGuard>
);
