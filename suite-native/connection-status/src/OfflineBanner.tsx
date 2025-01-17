import { View } from 'react-native';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useIsFwRevisionCheckOfflineError } from './useIsFwRevisionCheckOfflineError';
import { useIsOfflineBannerVisible } from './useIsOfflineBannerVisible';

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertYellowBold,
}));

const contentStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
        paddingTop: utils.spacings.sp8,
        paddingBottom: utils.spacings.sp16,
        paddingHorizontal: utils.spacings.sp16,
    }),
);

type OfflineBannerProps = { topSafeAreaInset: number };

export const OfflineBanner = ({ topSafeAreaInset }: OfflineBannerProps) => {
    const { applyStyle } = useNativeStyles();

    const isOfflineBannerVisible = useIsOfflineBannerVisible();
    const isFwRevisionCheckOfflineError = useIsFwRevisionCheckOfflineError();

    if (!isOfflineBannerVisible) {
        return null;
    }

    return (
        <View style={applyStyle(containerStyle)}>
            <VStack
                spacing="sp2"
                alignItems="center"
                style={applyStyle(contentStyle, { topSafeAreaInset })}
            >
                <HStack alignItems="center">
                    <Icon name="wifiSlash" size="mediumLarge" />
                    <Text variant="highlight">
                        <Translation id="generic.banners.offline.title" />
                    </Text>
                </HStack>
                {isFwRevisionCheckOfflineError && (
                    <Text textAlign="center">
                        <Translation id="generic.banners.offline.fwRevisionCheckOfflineError" />
                    </Text>
                )}
            </VStack>
        </View>
    );
};
