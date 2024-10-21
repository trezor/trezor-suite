import { G } from '@mobily/ts-belt';

import { CryptoIcon, CoinSymbolName, Icon, IconName, icons, IconSize } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box, BoxProps } from './Box';

export type RoundedIconProps = {
    name: IconName | CoinSymbolName;
    color?: Color;
    iconSize?: IconSize;
    containerSize?: number;
    backgroundColor?: Color;
} & BoxProps;

const DEFAULT_CONTAINER_SIZE = 48;

const iconContainerStyle = prepareNativeStyle<{ backgroundColor?: Color; containerSize?: number }>(
    (utils, { backgroundColor, containerSize }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        width: containerSize ?? DEFAULT_CONTAINER_SIZE,
        height: containerSize ?? DEFAULT_CONTAINER_SIZE,
        backgroundColor: utils.colors.backgroundSurfaceElevation2,
        borderRadius: utils.borders.radii.round,

        extend: {
            condition: G.isNotNullable(backgroundColor),
            style: {
                backgroundColor: utils.colors[backgroundColor as Color],
            },
        },
    }),
);

export const RoundedIcon = ({
    name,
    color,
    iconSize,
    backgroundColor,
    containerSize,
    style,
    ...boxProps
}: RoundedIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            style={[applyStyle(iconContainerStyle, { backgroundColor, containerSize }), style]}
            {...boxProps}
        >
            {name in icons ? (
                <Icon name={name as IconName} color={color} size={iconSize} />
            ) : (
                <CryptoIcon symbol={name as CoinSymbolName} />
            )}
        </Box>
    );
};
