import { Platform } from 'react-native';

import { IconName, Icon } from '@suite-common/icons';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
            style: utils.boxShadows.small,
        },
    }),
);

type BiometricsIconProps = {
    iconSize?: number;
    showShadow?: boolean;
};

export const BiometricsIcon = ({
    iconSize = ICON_SIZE_DEFAULT,
    showShadow = false,
}: BiometricsIconProps) => {
    const { applyStyle } = useNativeStyles();
    const icon: IconName = Platform.OS === 'ios' ? 'touchId' : 'fingerprint';
    const iconWrapperSize = iconSize + 2 * ICON_WRAPPER_PADDING;

    return (
        <Box
            style={applyStyle(iconWrapperStyle, {
                wrapperSize: iconWrapperSize,
                showShadow,
            })}
        >
            <Icon name={icon} color="iconPrimaryDefault" size={iconSize} />
        </Box>
    );
};
