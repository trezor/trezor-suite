import { useCallback, useMemo } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-native/analytics';
import { ListItemSkeleton, TitleHeader, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { EarnPromoListHeader } from '../components/EarnPromoListHeader';
import { EarnPromoListRow } from '../components/EarnPromoListRow';
import { EarnScreenListHeader } from '../components/EarnScreenListHeader';
import { useStablecoinYieldListData } from '../hooks/useStablecoinYieldListData';
import { useStakingListData } from '../hooks/useStakingListData';
import { type EarnPromoListDataItem, type EarnPromoSectionType } from '../types';

const getEarnListItemType = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? 'section-header' : `row-${item.type}`;

const getEarnListItemKey = (item: EarnPromoListDataItem) =>
    typeof item === 'string' ? item : item.id;

export const EarnScreen = () => {
    const analytics = useAnalytics();
    const {
        promoListData: stakingPromoItems,
        activeItems: stakingActiveItems,
        accountStakedWithFiveBinaries,
    } = useStakingListData();
    const { promoListData: stablecoinYieldPromoItems, activeItems: stablecoinYieldActiveItems } =
        useStablecoinYieldListData();

    const earnListData = useMemo(
        (): EarnPromoListDataItem[] => [...stakingPromoItems, ...stablecoinYieldPromoItems],
        [stablecoinYieldPromoItems, stakingPromoItems],
    );

    useFocusEffect(
        useCallback(() => {
            analytics.report({ type: events.earnNavigateEvent.name });
        }, [analytics]),
    );

    const handleInfoRequested = useCallback(
        (type: EarnPromoSectionType) => {
            analytics.report({
                type:
                    type === 'staking'
                        ? events.earnStakeTilePressedEvent.name
                        : events.earnStablecoinYieldTilePressedEvent.name,
            });
        },
        [analytics],
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
                    onInfoPress={handleInfoRequested}
                />
            );
        },
        [earnListData, handleInfoRequested],
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
            </VStack>
        </Screen>
    );
};
