import { Platform } from 'react-native';

import { Box } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const iconWrapperStyle = prepareNativeStyle(
    (utils, { iconSize, showShadow }: { iconSize: number; showShadow: boolean }) => ({
        padding: utils.spacings.sp12,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.legacyBackgroundSurfaceElevation2,
        color: utils.colors.contentBrand,
        width: iconSize + 2 * utils.spacings.sp12,
        height: iconSize + 2 * utils.spacings.sp12,

        extend: {
            condition: showShadow,
            style: { ...utils.boxShadows.small },
        },
    }),
);

type BiometricsIconProps = {
    iconSize?: number;
    showShadow?: boolean;
};

export const BiometricsIcon = ({ iconSize = 64, showShadow = false }: BiometricsIconProps) => {
    const { applyStyle } = useNativeStyles();
    const icon: IconName = Platform.OS === 'ios' ? 'fingerprintSimple' : 'fingerprint';

    return (
        <Box
            style={applyStyle(iconWrapperStyle, {
                iconSize,
                showShadow,
            })}
        >
            <Icon name={icon} color="contentBrand" size={iconSize} />
        </Box>
    );
};
