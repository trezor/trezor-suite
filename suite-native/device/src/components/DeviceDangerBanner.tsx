import { useAtomValue } from 'jotai';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { deviceDangerBannerAtom } from '../deviceAtoms';
import { DeviceDangerBannerExtension, bannerContentPresets } from './DeviceDangerBannerExtension';

type BannerAppearance = {
    backgroundColor: Color;
    iconName: IconName;
    iconColor: Color;
    textColor: Color;
};

const bannerIntentAppearance = {
    warning: {
        backgroundColor: 'elementFillWarningBold',
        iconName: 'warning',
        iconColor: 'contentPrimary',
        textColor: 'contentPrimary',
    },
    critical: {
        backgroundColor: 'elementFillCriticalSoft',
        iconName: 'warning',
        iconColor: 'contentPrimary',
        textColor: 'contentPrimary',
    },
} as const satisfies Record<'warning' | 'critical', BannerAppearance>;

const otherErrorAppearance = {
    backgroundColor: 'elementFillWarningBold',
    iconName: 'warning',
    iconColor: 'contentPrimary',
    textColor: 'contentPrimary',
} as const satisfies BannerAppearance;

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
    const { cause, variant } = deviceDanger;

    const titleTranslationId: TxKeyPath =
        variant === 'other-error'
            ? 'generic.banners.deviceDanger.revisionNotChecked.title'
            : bannerContentPresets[cause].title;

    const appearance =
        variant === 'other-error'
            ? otherErrorAppearance
            : bannerIntentAppearance[bannerContentPresets[cause].intent];

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor: appearance.backgroundColor })}>
            <VStack spacing="sp2" style={applyStyle(contentStyle, { topSafeAreaInset })}>
                <HStack alignItems="center">
                    <Icon
                        name={appearance.iconName}
                        size="mediumLarge"
                        color={appearance.iconColor}
                    />
                    <Text variant="body-md-strong" color={appearance.textColor}>
                        <Translation id={titleTranslationId} />
                    </Text>
                </HStack>
                {variant === 'extended' && <DeviceDangerBannerExtension />}
            </VStack>
        </Box>
    );
};
