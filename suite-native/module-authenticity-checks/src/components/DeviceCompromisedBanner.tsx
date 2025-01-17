import { View } from 'react-native';

import { useAtomValue } from 'jotai';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { deviceCompromisedBannerAtom } from '../DeviceCompromisedBannerAtoms';

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation0,
}));

const contentStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (utils, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
        paddingTop: utils.spacings.sp8,
        paddingBottom: utils.spacings.sp16,
        paddingHorizontal: utils.spacings.sp24,
        alignItems: 'center',
    }),
);

const ExtendedBannerContent = () => {
    const openLink = useOpenLink();
    const handleContactSupportClick = () =>
        openLink(TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL);

    return (
        <VStack spacing="sp16">
            <Text textAlign="center">
                <Translation id="generic.banners.deviceCompromised.subtitle" />
            </Text>
            <Button colorScheme="redBold" onPress={handleContactSupportClick}>
                <Translation id="generic.banners.deviceCompromised.contactSupportButton" />
            </Button>
        </VStack>
    );
};

export const DeviceCompromisedBanner = () => {
    const bannerVariant = useAtomValue(deviceCompromisedBannerAtom);
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useOfflineBannerAwareSafeAreaInsets();

    if (bannerVariant === 'none') return null;

    return (
        <View style={applyStyle(containerStyle)}>
            <VStack spacing="sp2" style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <HStack alignItems="center">
                    <Icon name="warningCircle" size="mediumLarge" />
                    <Text variant="highlight">
                        <Translation id="generic.banners.deviceCompromised.title" />
                    </Text>
                </HStack>
                {bannerVariant === 'extended' && <ExtendedBannerContent />}
            </VStack>
        </View>
    );
};
