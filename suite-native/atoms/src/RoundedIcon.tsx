import React from 'react';

import { G } from '@mobily/ts-belt';

import { CryptoIcon, CoinSymbol, Icon, IconName, icons, IconSize } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';

type RoundedIconProps = {
    name: IconName | CoinSymbol;
    color?: Color;
    size?: IconSize;
    backgroundColor?: Color;
};

const CONTAINER_SIZE = 48;

const iconContainerStyle = prepareNativeStyle<{ backgroundColor?: Color }>(
    (utils, { backgroundColor }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        width: CONTAINER_SIZE,
        height: CONTAINER_SIZE,
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

export const RoundedIcon = ({ name, color, size, backgroundColor }: RoundedIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(iconContainerStyle, { backgroundColor })}>
            {name && name in icons ? (
                <Icon name={name as IconName} color={color} size={size} />
            ) : (
                <CryptoIcon symbol={name as CoinSymbol} />
            )}
        </Box>
    );
};
