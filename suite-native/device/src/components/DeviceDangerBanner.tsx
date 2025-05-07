import { useAtomValue } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { DeviceDangerBannerVariant, deviceDangerBannerAtom } from '@suite-native/device';
import { Icon } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceDangerBannerExtension, bannerContentPresets } from './DeviceDangerBannerExtension';

const containerStyle = prepareNativeStyle<{ bannerVariant: DeviceDangerBannerVariant }>(
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

export const useIsDeviceDangerBannerVisible = () => useAtomValue(deviceDangerBannerAtom) !== null;

type DeviceCompromisedBannerProps = { topSafeAreaInset: number };

export const DeviceDangerBanner = ({ topSafeAreaInset }: DeviceCompromisedBannerProps) => {
    const deviceDanger = useAtomValue(deviceDangerBannerAtom);

    const { applyStyle } = useNativeStyles();

    if (!deviceDanger) return null;
    const { cause, variant } = deviceDanger;

    const titleTranslationId: TxKeyPath =
        variant === 'other-error'
            ? 'generic.banners.deviceDanger.revisionNotChecked.title'
            : bannerContentPresets[cause].title;

    return (
        <Box style={applyStyle(containerStyle, { bannerVariant: variant })}>
            <VStack spacing="sp2" style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <HStack alignItems="center">
                    <Icon name="warningCircle" size="mediumLarge" />
                    <Text variant="highlight">
                        <Translation id={titleTranslationId} />
                    </Text>
                </HStack>
                {variant === 'extended' && <DeviceDangerBannerExtension />}
            </VStack>
        </Box>
    );
};
