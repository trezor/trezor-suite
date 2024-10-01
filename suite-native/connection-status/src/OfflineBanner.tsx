import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { Icon } from '@suite-common/icons-deprecated';
import { Text, HStack } from '@suite-native/atoms';
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
        paddingBottom: 12,
        alignItems: 'center',
    }),
);

export const OfflineBanner = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useSafeAreaInsets();

    const isOfflineBannerVisible = useIsOfflineBannerVisible();

    if (!isOfflineBannerVisible) {
        return null;
    }

    return (
        <View style={applyStyle(containerStyle)}>
            <HStack style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <Icon name="wifiSlash" size="mediumLarge" />
                <Text>
                    <Translation id="generic.offline" />
                </Text>
            </HStack>
        </View>
    );
};
