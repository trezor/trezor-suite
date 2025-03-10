import { View } from 'react-native';

import { useAtomValue } from 'jotai';

import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import {
    DeviceCompromisedBannerVariant,
    deviceCompromisedBannerAtom,
} from '../DeviceCompromisedBannerAtoms';

const containerStyle = prepareNativeStyle<{ bannerVariant: DeviceCompromisedBannerVariant }>(
    (utils, { bannerVariant }) => ({
        backgroundColor:
            bannerVariant === 'other-error'
                ? utils.colors.backgroundAlertYellowBold
                : utils.colors.backgroundAlertRedSubtleOnElevation0,
        // MessageSystemBanner critical variant has the same bgColor, so the margin serves to separate them visually
        marginBottom: utils.spacings.sp1,
    }),
);

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

export const useIsDeviceCompromisedBannerVisible = () =>
    useAtomValue(deviceCompromisedBannerAtom) !== 'none';

type DeviceCompromisedBannerProps = { topSafeAreaInset: number };

export const DeviceCompromisedBanner = ({ topSafeAreaInset }: DeviceCompromisedBannerProps) => {
    const bannerVariant = useAtomValue(deviceCompromisedBannerAtom);
    const { applyStyle } = useNativeStyles();

    if (bannerVariant === 'none') return null;

    const titleTranslationId =
        bannerVariant === 'other-error'
            ? 'generic.banners.fwRevisionCheckOtherError'
            : 'generic.banners.deviceCompromised.title';

    return (
        <View style={applyStyle(containerStyle, { bannerVariant })}>
            <VStack spacing="sp2" style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <HStack alignItems="center">
                    <Icon name="warningCircle" size="mediumLarge" />
                    <Text variant="highlight">
                        <Translation id={titleTranslationId} />
                    </Text>
                </HStack>
                {bannerVariant === 'extended' && <ExtendedBannerContent />}
            </VStack>
        </View>
    );
};
