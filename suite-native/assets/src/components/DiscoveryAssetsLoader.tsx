import React from 'react';
import { useSelector } from 'react-redux';

import { ListItemSkeleton, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { useTranslate } from '@suite-native/intl';
import { selectIsAccountsListEmpty } from '@suite-common/wallet-core';

type DiscoveryAssetsLoaderProps = {
    emptyListSkeletonCount: number;
};

export const DiscoveryAssetsLoader = ({ emptyListSkeletonCount }: DiscoveryAssetsLoaderProps) => {
    const { translate } = useTranslate();
    const isListEmpty = useSelector(selectIsAccountsListEmpty);

    const discoveryProgressText = translate(
        isListEmpty
            ? 'assets.dashboard.discoveryProgress.loading'
            : 'assets.dashboard.discoveryProgress.stillWorking',
    );

    const numberOfSkeletons = isListEmpty ? emptyListSkeletonCount : 1;

    return (
        <>
            {Array.from({ length: numberOfSkeletons }, (_, i) => (
                <ListItemSkeleton key={i} />
            ))}

            <HStack justifyContent="center">
                <Icon size="mediumLarge" name="trezor" />
                <Text variant="callout">{discoveryProgressText}</Text>
            </HStack>
        </>
    );
};
