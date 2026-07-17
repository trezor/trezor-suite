import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TitleHeader, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { ChooseStakingAccountBottomSheet } from '../components/ChooseStakingAccountBottomSheet';
import { EarnItemInfoModal } from '../components/EarnItemInfoModal';
import { EarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { EarnPoweredByProvider } from '../components/EarnPoweredByProvider';
import { EarnPromoListHeader } from '../components/EarnPromoListHeader';
import {
    EarnPromoListRow,
    EarnPromoListRowContainer,
    EarnPromoListSkeletonRow,
} from '../components/EarnPromoListRow';
import { EarnScreenListHeader } from '../components/EarnScreenListHeader';
import { EarnStakingProvidersInfo } from '../components/EarnStakingProvidersInfo';
import { EnableNetworkForEarnBottomSheet } from '../components/EnableNetworkForEarnBottomSheet';
import { StablecoinYieldLoadErrorAlert } from '../components/StablecoinYieldLoadErrorAlert';
import { useStablecoinYieldListData } from '../hooks/useStablecoinYieldListData';
import { useStablecoinYieldPromoNavigation } from '../hooks/useStablecoinYieldPromoNavigation';
import { useStakingListData } from '../hooks/useStakingListData';
import { useStakingPromoNavigation } from '../hooks/useStakingPromoNavigation';
import { type EarnPromoItem, type EarnPromoListDataItem } from '../types';

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

    const earnListData = useMemo(
        (): EarnPromoListDataItem[] => [...stakingPromoItems, ...stablecoinYieldPromoItems],
        [stablecoinYieldPromoItems, stakingPromoItems],
    );

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

            if (item.type === 'stablecoin-yield-load-error') {
                return (
                    <EarnPromoListRowContainer isLastInSection={isLastInSection}>
                        <StablecoinYieldLoadErrorAlert onRetry={retryLoadStablecoinYield} />
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
            <VStack spacing="sp32" marginTop="sp16">
                <TitleHeader
                    titleSpacing="sp4"
                    titleVariant="headline-md"
                    title={<Translation id="earn.earnScreen.title" />}
                    subtitleVariant="body-sm"
                />

                <FlashList
                    data={earnListData}
                    getItemType={getEarnListItemType}
                    ListHeaderComponent={
                        <EarnScreenListHeader
                            isStablecoinYieldLoading={isYieldLoading}
                            isStablecoinYieldClaimSummariesLoading={isClaimSummariesLoading}
                            cardanoStakingAccountKey={accountStakedWithFiveBinaries?.key}
                            stakingActiveItems={stakingActiveItems}
                            stablecoinYieldActiveItems={stablecoinYieldActiveItems}
                            stablecoinYieldClaimSummaries={stablecoinYieldClaimSummaries}
                            stablecoinYieldTotalFiatClaimableAmount={
                                stablecoinYieldTotalFiatClaimableAmount
                            }
                        />
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
                    tokenBalance={stablecoinYield.chooseAccountTokenBalance}
                />
                <EnableNetworkForEarnBottomSheet
                    ref={stablecoinYield.enableNetworkSheetRef}
                    symbol={stablecoinYield.pendingEnableSymbol}
                    type="stablecoin-yield"
                    onEnablePress={stablecoinYield.handleEnableNetworkPress}
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
