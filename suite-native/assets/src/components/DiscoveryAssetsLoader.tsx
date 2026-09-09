import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { getSupportedNetworks } from '@suite-common/wallet-config';
import { HStack, ListItemSkeleton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { selectIsAssetListEmpty, selectIsAssetListLoading } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

export const DiscoveryAssetsLoader = () => {
    const allNetworkSymbols = getSupportedNetworks();

    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const isAssetListEmpty = useSelector((state: AssetsRootState) =>
        selectIsAssetListEmpty(state, allNetworkSymbols),
    );

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
