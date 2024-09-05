import React from 'react';

import { ListItemSkeleton, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons-deprecated';
import { Translation } from '@suite-native/intl';

const DEFAULT_LIST_SKELETON_COUNT = 3;
const MINIMUM_LIST_SKELETON_COUNT = 1;

export const DiscoveryAssetsLoader = ({ numberOfAssets }: { numberOfAssets: number }) => {
    const isListEmpty = numberOfAssets === 0;

    const discoveryProgressText = (
        <Translation
            id={
                isListEmpty
                    ? 'assets.dashboard.discoveryProgress.loading'
                    : 'assets.dashboard.discoveryProgress.stillWorking'
            }
        />
    );

    // There should always be
    const numberOfSkeletons = Math.max(
        DEFAULT_LIST_SKELETON_COUNT - numberOfAssets,
        MINIMUM_LIST_SKELETON_COUNT,
    );

    return (
        <>
            {Array.from({ length: numberOfSkeletons }, (_, i) => (
                <ListItemSkeleton key={i} />
            ))}

            <HStack justifyContent="center" marginBottom="medium">
                <Icon size="mediumLarge" name="trezor" />
                <Text variant="callout">{discoveryProgressText}</Text>
            </HStack>
        </>
    );
};
