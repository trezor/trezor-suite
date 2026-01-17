import React from 'react';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
import { useStakingListData } from '../hooks/useStakingListData';

type EarnSectionHeaderProps = {
    title: string;
};

export const EarnSectionHeader = ({ title }: EarnSectionHeaderProps) => {
    const { accountStakedWithFiveBinaries } = useStakingListData();

    return (
        <VStack spacing="sp16" marginBottom="sp16">
            <HStack>
                <Icon name="coins" />
                <Text variant="highlight">{title}</Text>
            </HStack>
            {accountStakedWithFiveBinaries && (
                <CardanoStakingInfoBanner accountKey={accountStakedWithFiveBinaries?.key} />
            )}
        </VStack>
    );
};
