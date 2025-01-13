import React from 'react';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { ListItemSkeleton, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
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
        <Animated.View entering={FadeInDown} layout={LinearTransition}>
            <ListItemSkeleton />
            <HStack justifyContent="center" marginBottom="sp16">
                <Icon size="mediumLarge" name="trezorLogo" />
                <Text variant="callout">{discoveryProgressText}</Text>
            </HStack>
        </Animated.View>
    );
};
