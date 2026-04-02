import { useCallback, useMemo } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-native/analytics';
import { ListItemSkeleton, TitleHeader, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { ChooseStakingAccountBottomSheet } from '../components/ChooseStakingAccountBottomSheet';
import { EarnItemInfoModal } from '../components/EarnItemInfoModal';
import { EarnPromoListHeader } from '../components/EarnPromoListHeader';
import { EarnPromoListRow } from '../components/EarnPromoListRow';
import { EarnScreenListHeader } from '../components/EarnScreenListHeader';
import { useStablecoinYieldListData } from '../hooks/useStablecoinYieldListData';
import { useStakingListData } from '../hooks/useStakingListData';
import { useStakingPromoNavigation } from '../hooks/useStakingPromoNavigation';
import { type EarnPromoItem, type EarnPromoListDataItem } from '../types';

const getEarnListItemType = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? 'section-header' : `row-${item.type}`;

const getEarnListItemKey = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? item : item.id;

export const EarnScreen = () => {
    const analytics = useAnalytics();
    const {
        bottomSheetRef: stablecoinYieldBottomSheetRef,
        openModal: openStablecoinYieldModal,
        closeModal: closeStablecoinYieldModal,
    } = useBottomSheetModal();

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
        chosenAccounts,
        infoSheetRef,
        chooseAccountSheetRef,
        closeChooseAccountModal,
    } = useStakingPromoNavigation();

    const dismissAllModals = useCallback(() => {
        closeStablecoinYieldModal();
        closeChooseAccountModal();
    }, [closeStablecoinYieldModal, closeChooseAccountModal]);

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
            dismissAllModals();

            if (item.type === 'stablecoin-yield') {
                analytics.report({
                    type: events.earnStablecoinYieldTilePressedEvent.name,
                });
                openStablecoinYieldModal();

                return;
            }

            analytics.report({
                type: events.earnStakeTilePressedEvent.name,
            });

            handleStakingPromoPress(item);
        },
        [analytics, dismissAllModals, handleStakingPromoPress, openStablecoinYieldModal],
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
                    subtitle={<Translation id="earn.earnScreen.subtitle" />}
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
                <EarnItemInfoModal ref={stablecoinYieldBottomSheetRef} type="stablecoin-yield" />
                <ChooseStakingAccountBottomSheet
                    ref={chooseAccountSheetRef}
                    accounts={chosenAccounts}
                    onAccountSelected={handleAccountSelected}
                    onClose={closeChooseAccountModal}
                />
            </VStack>
        </Screen>
    );
};
