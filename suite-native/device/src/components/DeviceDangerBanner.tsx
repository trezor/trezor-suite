import { useAtomValue } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { type DeviceDangerBannerIntent, deviceDangerBannerAtom } from '../deviceAtoms';
import { DeviceDangerBannerExtension, bannerContentPresets } from './DeviceDangerBannerExtension';

type DeviceDangerBannerAppearance = {
    backgroundColor: Color;
    iconName: IconName;
    iconColor: Color;
};

const bannerAppearanceByIntent = {
    critical: {
        backgroundColor: 'elementFillCriticalSoft',
        iconName: 'warningCircle',
        iconColor: 'contentPrimary',
    },
    warning: {
        backgroundColor: 'elementFillWarningSoft',
        iconName: 'warning',
        iconColor: 'contentWarning',
    },
} as const satisfies Record<DeviceDangerBannerIntent, DeviceDangerBannerAppearance>;

const containerStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
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
    const { cause, variant, intent } = deviceDanger;
    const { backgroundColor, iconName, iconColor } = bannerAppearanceByIntent[intent];

    const titleTranslationId: TxKeyPath =
        variant === 'other-error'
            ? 'generic.banners.deviceDanger.revisionNotChecked.title'
            : bannerContentPresets[cause].title;

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor })}>
            <VStack spacing="sp2" style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <HStack alignItems="center">
                    <Icon name={iconName} color={iconColor} size="mediumLarge" />
                    <Text variant="body-md-strong">
                        <Translation id={titleTranslationId} />
                    </Text>
                </HStack>
                {variant === 'extended' && <DeviceDangerBannerExtension />}
            </VStack>
        </Box>
    );
};
