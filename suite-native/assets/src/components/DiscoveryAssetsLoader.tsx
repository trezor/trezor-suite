import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { HStack, ListItemSkeleton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { selectIsAssetListEmpty, selectIsAssetListLoading } from '../assetsSelectors';

export const DiscoveryAssetsLoader = () => {
    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const isAssetListEmpty = useSelector(selectIsAssetListEmpty);

    if (!isAssetListLoading) {
        return null;
    }

    return (
        <Animated.View entering={FadeInDown} layout={LinearTransition}>
            <ListItemSkeleton />
            <HStack justifyContent="center" marginBottom="sp16">
                <Icon size="mediumLarge" name="trezorLogo" />
                <Text variant="body-sm-strong">
                    <Translation
                        id={
                            isAssetListEmpty
                                ? 'assets.dashboard.discoveryProgress.loading'
                                : 'assets.dashboard.discoveryProgress.stillWorking'
                        }
                    />
                </Text>
            </HStack>
        </Animated.View>
    );
};
