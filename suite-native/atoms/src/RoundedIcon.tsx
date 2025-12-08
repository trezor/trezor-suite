import { G } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { CryptoIcon, Icon, IconName, IconSize, icons } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box, BoxProps } from './Box';
import { FileArrowDownSvg } from './Pictogram/FileArrowDownSvg';

export type RoundedIconProps = {
    name?: IconName;
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
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

const IconSvgMap = {
    fileArrowDown: FileArrowDownSvg,
};

export const RoundedIconSvg = ({
    name,
    symbol,
    contractAddress,
    color,
    iconSize,
    backgroundColor,
    containerSize,
    style,
    ...boxProps
}: any) => {
    const { applyStyle } = useNativeStyles();

    const IconComponent = name ? IconSvgMap[name as keyof typeof IconSvgMap] : null;
    if (!IconComponent) {
        return null;
    }

    return (
        <Box
            style={[applyStyle(iconContainerStyle, { backgroundColor, containerSize }), style]}
            {...boxProps}
        >
            <IconComponent color="#000000" />
        </Box>
    );
};

export const RoundedIcon = ({
    name,
    symbol,
    contractAddress,
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
            {name && name in icons ? (
                <Icon name={name as IconName} color={color} size={iconSize} />
            ) : (
                symbol && <CryptoIcon symbol={symbol} contractAddress={contractAddress} />
            )}
        </Box>
    );
};
