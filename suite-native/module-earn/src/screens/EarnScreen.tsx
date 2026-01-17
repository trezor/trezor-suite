import React from 'react';

import { FlashList } from '@shopify/flash-list';

import { StakingNetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { TitleHeader, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { EarnListItem } from '../components/EarnListItem';
import { EarnSectionHeader } from '../components/EarnSectionHeader';
import { useStakingListData } from '../hooks/useStakingListData';

export type EarnItem = {
    symbol: StakingNetworkSymbol;
    accountKey: Account['key'];
    accountLabel?: Account['accountLabel'];
};

export type EarnListItem = string | EarnItem;

const renderItem = ({ item }: { item: EarnListItem }) => {
    if (typeof item === 'string') {
        return <EarnSectionHeader title={item} />;
    } else {
        return <EarnListItem {...item} />;
    }
};

export const EarnScreen = () => {
    const { listData } = useStakingListData();

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp32" marginTop="sp16">
                <TitleHeader
                    titleSpacing="sp4"
                    titleVariant="titleMedium"
                    title={<Translation id="earn.earnScreen.title" />}
                    subtitle={<Translation id="earn.earnScreen.subtitle" />}
                    subtitleVariant="hint"
                />

                <FlashList
                    getItemType={item => (typeof item === 'string' ? 'sectionHeader' : 'item')}
                    data={listData}
                    renderItem={renderItem}
                />
            </VStack>
        </Screen>
    );
};
