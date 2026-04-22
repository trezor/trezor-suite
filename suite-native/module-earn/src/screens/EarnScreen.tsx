import { useCallback, useMemo } from 'react';

import { useBottomSheetModal as useBottomSheetModalContext } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-native/analytics';
import { ListItemSkeleton, TitleHeader, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { ChooseStakingAccountBottomSheet } from '../components/ChooseStakingAccountBottomSheet';
import { EarnItemInfoModal } from '../components/EarnItemInfoModal';
import { EarnPortfolioTrackerGuard } from '../components/EarnPortfolioTrackerGuard';
import { EarnPromoListHeader } from '../components/EarnPromoListHeader';
import { EarnPromoListRow } from '../components/EarnPromoListRow';
import { EarnScreenListHeader } from '../components/EarnScreenListHeader';
import { EnableNetworkForStakingBottomSheet } from '../components/EnableNetworkForStakingBottomSheet';
import { useStablecoinYieldListData } from '../hooks/useStablecoinYieldListData';
import { useStakingListData } from '../hooks/useStakingListData';
import { useStakingPromoNavigation } from '../hooks/useStakingPromoNavigation';
import { type EarnPromoItem, type EarnPromoListDataItem } from '../types';

const getEarnListItemType = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? 'section-header' : `row-${item.type}`;

const getEarnListItemKey = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? item : item.id;

const EarnScreenContent = () => {
    const analytics = useAnalytics();
    const { dismissAll } = useBottomSheetModalContext();

    const {
        promoListData: stakingPromoItems,
        activeItems: stakingActiveItems,
        accountStakedWithFiveBinaries,
    } = useStakingListData();
    const { promoListData: stablecoinYieldPromoItems, activeItems: stablecoinYieldActiveItems } =
        useStablecoinYieldListData();

    const {
        handleStakingPromoPress,
        handleAccountSelected,
        handleEnableNetworkPress,
        handleChooseAccountDismiss,
        handleEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        infoSheetRef,
        chooseAccountSheetRef,
        enableNetworkSheetRef,
        closeChooseAccountModal,
    } = useStakingPromoNavigation();

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
            dismissAll();

            if (item.type === 'stablecoin-yield') {
                if (!item.accountKey || !item.contractAddress) {
                    return;
                }

                analytics.report({
                    type: events.earnStablecoinYieldTilePressedEvent.name,
                });

                return;
            }

            analytics.report({
                type: events.earnStakeTilePressedEvent.name,
            });

            handleStakingPromoPress(item);
        },
        [analytics, dismissAll, handleStakingPromoPress],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: EarnPromoListDataItem; index: number }) => {
            if (typeof item === 'string') {
                return <EarnPromoListHeader item={item} />;
            }

            const nextItem = earnListData[index + 1];
            const isLastInSection = nextItem === undefined || typeof nextItem === 'string';

            if (item.type === 'skeleton-loader') {
                return <ListItemSkeleton />;
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
                            cardanoStakingAccountKey={accountStakedWithFiveBinaries?.key}
                            stakingActiveItems={stakingActiveItems}
                            stablecoinYieldActiveItems={stablecoinYieldActiveItems}
                        />
                    }
                    keyExtractor={getEarnListItemKey}
                    renderItem={renderItem}
                />

                <EarnItemInfoModal ref={infoSheetRef} type="staking" />
                <ChooseStakingAccountBottomSheet
                    ref={chooseAccountSheetRef}
                    accounts={chosenAccounts}
                    onAccountSelected={handleAccountSelected}
                    onClose={closeChooseAccountModal}
                    onDismiss={handleChooseAccountDismiss}
                />
                <EnableNetworkForStakingBottomSheet
                    ref={enableNetworkSheetRef}
                    symbol={pendingEnableSymbol}
                    onEnablePress={handleEnableNetworkPress}
                    onDismiss={handleEnableNetworkDismiss}
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
