import { Platform } from 'react-native';

import { IconName, Icon } from '@suite-common/icons';
import { HStack, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useBiometricsSettings } from '../useBiometricsSettings';

const ICON_SIZE_DEFAULT = 64;
const ICON_WRAPPER_PADDING = 12;

const iconWrapperStyle = prepareNativeStyle(
    (utils, { wrapperSize, showShadow }: { wrapperSize: number; showShadow: boolean }) => ({
        padding: ICON_WRAPPER_PADDING,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.backgroundSurfaceElevation2,
        color: utils.colors.iconPrimaryDefault,
        width: wrapperSize,
        height: wrapperSize,

        extend: {
            condition: showShadow,
            style: {
                shadowColor: utils.boxShadows.small.shadowColor,
                shadowOffset: utils.boxShadows.small.shadowOffset,
                shadowRadius: utils.boxShadows.small.shadowRadius,
                elevation: utils.boxShadows.small.elevation,
                shadowOpacity: utils.boxShadows.small.shadowOpacity,
            },
        },
    }),
);

type BiometricsIconsProps = {
    iconSize?: number;
    showShadow?: boolean;
};

export const BiometricsIcons = ({
    iconSize = ICON_SIZE_DEFAULT,
    showShadow = false,
}: BiometricsIconsProps) => {
    const { applyStyle } = useNativeStyles();
    const { isFacialEnabled, isFingerprintEnabled } = useBiometricsSettings();
    const faceRecognitionIcon: IconName = Platform.OS === 'ios' ? 'faceId' : 'face';
    const fingerprintIcon: IconName = Platform.OS === 'ios' ? 'touchId' : 'fingerprint';
    const primaryIcon: IconName = isFingerprintEnabled ? fingerprintIcon : faceRecognitionIcon;

    const iconWrapperSize = iconSize + 2 * ICON_WRAPPER_PADDING;

    const isSecondaryIconDisplayed = isFingerprintEnabled && isFacialEnabled;

    return (
        <HStack spacing="extraSmall">
            <Box
                style={applyStyle(iconWrapperStyle, {
                    wrapperSize: iconWrapperSize,
                    showShadow,
                })}
            >
                <Icon name={primaryIcon} color="iconPrimaryDefault" size={iconSize} />
            </Box>
            {isSecondaryIconDisplayed && (
                <Box
                    style={applyStyle(iconWrapperStyle, {
                        wrapperSize: iconWrapperSize,
                        showShadow,
                    })}
                >
                    <Icon name="face" color="iconPrimaryDefault" size={iconSize} />
                </Box>
            )}
        </HStack>
    );
};
