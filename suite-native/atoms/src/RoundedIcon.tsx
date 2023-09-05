import { G } from '@mobily/ts-belt';

import { CryptoIcon, CoinSymbol, Icon, IconName, icons, IconSize } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';

type RoundedIconProps = {
    name: IconName | CoinSymbol;
    color?: Color;
    iconSize?: IconSize;
    containerSize?: number;
    backgroundColor?: Color;
};

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
}: RoundedIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(iconContainerStyle, { backgroundColor, containerSize })}>
            {name in icons ? (
                <Icon name={name as IconName} color={color} size={iconSize} />
            ) : (
                <CryptoIcon symbol={name as CoinSymbol} />
            )}
        </Box>
    );
};
