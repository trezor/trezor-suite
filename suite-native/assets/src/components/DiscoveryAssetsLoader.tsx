import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { HStack, ListItemSkeleton, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectIsAssetListEmpty } from '../assetsSelectors';

type DiscoveryAssetsLoaderProps = {
    isFirst?: boolean;
    isLast?: boolean;
};

// Reproduces the rounded-card background the loader used to inherit from its wrapping card, so it
// blends with the surrounding asset rows now that each row owns its own background.
const loaderCardStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (utils, { isFirst, isLast }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        extend: [
            {
                condition: isFirst,
                style: {
                    borderTopLeftRadius: utils.borders.radii.r16,
                    borderTopRightRadius: utils.borders.radii.r16,
                    ...utils.boxShadows.small,
                },
            },
            {
                condition: isLast,
                style: {
                    borderBottomLeftRadius: utils.borders.radii.r16,
                    borderBottomRightRadius: utils.borders.radii.r16,
                    ...utils.boxShadows.small,
                },
            },
        ],
    }),
);

export const DiscoveryAssetsLoader = ({
    isFirst = false,
    isLast = false,
}: DiscoveryAssetsLoaderProps) => {
    const { applyStyle } = useNativeStyles();
    const isAssetListEmpty = useSelector(selectIsAssetListEmpty);

    return (
        <Animated.View
            entering={FadeInDown}
            style={applyStyle(loaderCardStyle, { isFirst, isLast })}
        >
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
