import React from 'react';

import { ListItemSkeleton, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons-deprecated';
import { Translation } from '@suite-native/intl';

export const DiscoveryAssetsLoader = ({ isListEmpty }: { isListEmpty: boolean }) => {
    const discoveryProgressText = (
        <Translation
            id={
                isListEmpty
                    ? 'assets.dashboard.discoveryProgress.loading'
                    : 'assets.dashboard.discoveryProgress.stillWorking'
            }
        />
    );

    return (
        <>
            <ListItemSkeleton />
            <HStack justifyContent="center" marginBottom="medium">
                <Icon size="mediumLarge" name="trezor" />
                <Text variant="callout">{discoveryProgressText}</Text>
            </HStack>
        </>
    );
};
