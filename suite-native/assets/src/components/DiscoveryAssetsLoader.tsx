import React from 'react';

import { ListItemSkeleton, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { useTranslate } from '@suite-native/intl';

const DEFAULT_LIST_SKELETON_COUNT = 3;
const MINIMUM_LIST_SKELETON_COUNT = 1;

export const DiscoveryAssetsLoader = ({ numberOfAssets }: { numberOfAssets: number }) => {
    const { translate } = useTranslate();
    const isListEmpty = numberOfAssets === 0;

    const discoveryProgressText = translate(
        isListEmpty
            ? 'assets.dashboard.discoveryProgress.loading'
            : 'assets.dashboard.discoveryProgress.stillWorking',
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

            <HStack justifyContent="center">
                <Icon size="mediumLarge" name="trezor" />
                <Text variant="callout">{discoveryProgressText}</Text>
            </HStack>
        </>
    );
};
