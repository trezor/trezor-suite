import { View } from 'react-native';

import { HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useIsOfflineBannerVisible } from './useIsOfflineBannerVisible';

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertYellowBold,
    alignItems: 'center',
}));

const contentStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
        paddingTop: utils.spacings.sp8,
        paddingBottom: utils.spacings.sp12,
        alignItems: 'center',
    }),
);

type OfflineBannerProps = { topSafeAreaInset: number };

export const OfflineBanner = ({ topSafeAreaInset }: OfflineBannerProps) => {
    const { applyStyle } = useNativeStyles();

    const isOfflineBannerVisible = useIsOfflineBannerVisible();

    if (!isOfflineBannerVisible) {
        return null;
    }

    return (
        <View style={applyStyle(containerStyle)}>
            <HStack style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <Icon name="wifiSlash" size="mediumLarge" />
                <Text>
                    <Translation id="generic.banners.offline.title" />
                </Text>
            </HStack>
        </View>
    );
};
