import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { HStack, ListItemSkeleton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { selectIsAssetListEmpty } from '../assetsSelectors';

export const DiscoveryAssetsLoader = () => {
    const isAssetListEmpty = useSelector(selectIsAssetListEmpty);

    return (
        <Animated.View entering={FadeInDown}>
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
