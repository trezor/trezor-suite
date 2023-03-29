import React, { ReactNode } from 'react';

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

    const getIconByName = (): ReactNode | null => {
        if (isCryptoIconType(name)) {
            return <CryptoIcon name={name} />;
        }
        if (isIconType(name)) {
            return <Icon name={name} color={iconColor} />;
        }
        if (isFlagIconType(name)) {
            return <FlagIcon name={name} />;
        }
        if (isEthereumTokenIconType(name)) {
            return <EthereumTokenIcon name={name} />;
        }
        return null;
    };

    return <Box style={applyStyle(roundedIconStyle, { backgroundColor })}>{getIconByName()}</Box>;
};
