import { Platform } from 'react-native';

import { Icon, IconName } from '@suite-common/icons-deprecated';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const iconWrapperStyle = prepareNativeStyle(
    (utils, { iconSize, showShadow }: { iconSize: number; showShadow: boolean }) => ({
        padding: utils.spacings.sp12,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.backgroundSurfaceElevation2,
        color: utils.colors.iconPrimaryDefault,
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
    const icon: IconName = Platform.OS === 'ios' ? 'touchId' : 'fingerprint';

    return (
        <Box
            style={applyStyle(iconWrapperStyle, {
                iconSize,
                showShadow,
            })}
        >
            <Icon name={icon} color="iconPrimaryDefault" size={iconSize} />
        </Box>
    );
};
