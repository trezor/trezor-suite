import React from 'react';

import { Color } from '@trezor/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    CryptoIcon,
    EthereumTokenIcon,
    FlagIcon,
    Icon,
    IconNames,
    isCryptoIconType,
    isEthereumTokenIconType,
    isFlagIconType,
    isIconType,
} from '@trezor/icons';

import { Box } from './Box';

type RoundedIconProps = {
    name: IconNames;
    backgroundColor: Color;
    iconColor?: Color;
};

const DEFAULT_ICON_SIZE = 48;
const roundedIconStyle = prepareNativeStyle<{ backgroundColor: Color }>(
    (utils, { backgroundColor }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        width: DEFAULT_ICON_SIZE,
        height: DEFAULT_ICON_SIZE,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.round,
    }),
);

export const RoundedIcon = ({
    name,
    backgroundColor,
    iconColor = 'iconDefault',
}: RoundedIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(roundedIconStyle, { backgroundColor })}>
            {isCryptoIconType(name) && <CryptoIcon name={name} />}
            {isIconType(name) && <Icon name={name} color={iconColor} />}
            {isFlagIconType(name) && <FlagIcon name={name} />}
            {isEthereumTokenIconType(name) && <EthereumTokenIcon name={name} />}
        </Box>
    );
};
