import React, { useCallback, useMemo } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { events } from '@suite-native/analytics';
import { TitleHeader, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { EarnListItem } from '../components/EarnListItem';
import { EarnSectionHeader } from '../components/EarnSectionHeader';
import { useStablecoinYieldListData } from '../hooks/useStablecoinYieldListData';
import { useStakingListData } from '../hooks/useStakingListData';
import { EarnItem } from '../types';

export type EarnListItem = string | EarnItem;

const renderItem = ({ item }: { item: EarnListItem }) => {
    if (typeof item === 'string') {
        return <EarnSectionHeader title={item} />;
    } else {
        return <EarnListItem {...item} />;
    }
};

export const EarnScreen = () => {
    const { listData: stakingListData } = useStakingListData();
    const { listData: stablecoinListData } = useStablecoinYieldListData();

    const earnListData = useMemo(
        () => [...stakingListData, ...stablecoinListData],
        [stakingListData, stablecoinListData],
    );

    const analytics = useAnalytics();

    useFocusEffect(
        useCallback(() => {
            analytics.report({ type: events.earnNavigateEvent.name });
        }, [analytics]),
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
                    getItemType={item => (typeof item === 'string' ? 'sectionHeader' : 'item')}
                    data={earnListData}
                    renderItem={renderItem}
                />
            </VStack>
        </Screen>
    );
};
