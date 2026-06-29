import { useCallback, useMemo } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { TitleHeader, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { ChooseStakingAccountBottomSheet } from '../components/ChooseStakingAccountBottomSheet';
import { EarnItemInfoModal } from '../components/EarnItemInfoModal';
import { EarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { EarnPoweredByProvider } from '../components/EarnPoweredByProvider';
import { EarnPromoListHeader } from '../components/EarnPromoListHeader';
import { EarnPromoListRow, EarnPromoListSkeletonRow } from '../components/EarnPromoListRow';
import { EarnScreenListHeader } from '../components/EarnScreenListHeader';
import { EnableNetworkForEarnBottomSheet } from '../components/EnableNetworkForEarnBottomSheet';
import { useStablecoinYieldFlag } from '../hooks/useStablecoinYieldFlag';
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
    item === undefined || typeof item === 'string' || item.type === 'provider';

const EarnScreenContent = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { bottomSheetRef: stablecoinYieldBottomSheetRef, openModal: openStablecoinYieldModal } =
        useBottomSheetModal();
    const isStablecoinYieldEnabled = useStablecoinYieldFlag();

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

    const handlePromoItemPress = useCallback(
        (item: EarnPromoItem) => {
            if (item.type === 'stablecoin-yield') {
                analytics.report({
                    type: events.earnStablecoinYieldTilePressedEvent.name,
                });

                if (isStablecoinYieldEnabled) {
                    handleStablecoinYieldPromoPress(item);
                } else {
                    openStablecoinYieldModal();
                }

                return;
            }

            analytics.report({
                type: events.earnStakeTilePressedEvent.name,
            });

            handleStakingPromoPress(item);
        },
        [
            analytics,
            handleStablecoinYieldPromoPress,
            handleStakingPromoPress,
            isStablecoinYieldEnabled,
            openStablecoinYieldModal,
        ],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: EarnPromoListDataItem; index: number }) => {
            if (typeof item === 'string') {
                return <EarnPromoListHeader item={item} />;
            }

            if (item.type === 'provider') {
                return <EarnPoweredByProvider provider={item.provider} />;
            }

            const nextItem = earnListData[index + 1];
            const isLastInSection = isSectionBoundaryItem(nextItem);

            if (item.type === 'skeleton-loader') {
                return <EarnPromoListSkeletonRow isLastInSection={isLastInSection} />;
            }

            return (
                <EarnPromoListRow
                    item={item}
                    isLastInSection={isLastInSection}
                    onPress={handlePromoItemPress}
                />
            );
        },
        [earnListData, handlePromoItemPress],
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
                <EarnItemInfoModal ref={stablecoinYieldBottomSheetRef} type="stablecoin-yield" />
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
