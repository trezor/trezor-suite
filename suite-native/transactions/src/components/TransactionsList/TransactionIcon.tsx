import React from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CryptoIcon, CryptoIconName, Icon, IconName } from '@trezor/icons';
import { Color } from '@trezor/theme';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    cryptoIconName: CryptoIconName;
    transactionType: TransactionType;
    isAnimated?: boolean;
    iconColor?: Color;
    backgroundColor?: Color;
};

const ICON_SIZE = 48;

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'receive',
    sent: 'send',
    contract: 'placeholder',
    joint: 'placeholder',
    self: 'placeholder',
    failed: 'placeholder',
    unknown: 'placeholder',
};

type TransactionIconStyleProps = {
    backgroundColor: Color;
};

const transactionIconStyle = prepareNativeStyle<TransactionIconStyleProps>(
    (utils, { backgroundColor }) => ({
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.round,
        padding: 14.5,
    }),
);

const cryptoIconStyle = prepareNativeStyle<TransactionIconStyleProps>(
    (utils, { backgroundColor }) => ({
        position: 'absolute',
        right: -2,
        bottom: -2,
        padding: 2,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.round,
    }),
);

export const TransactionIcon = ({
    cryptoIconName,
    transactionType,
    isAnimated = false,
    iconColor = 'iconSubdued',
    backgroundColor = 'backgroundSurfaceElevation2',
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            <Box style={applyStyle(transactionIconStyle, { backgroundColor })}>
                <Icon
                    name={transactionIconMap[transactionType]}
                    color={iconColor}
                    size="mediumLarge"
                />
            </Box>
            {isAnimated && <TransactionIconSpinner radius={ICON_SIZE / 2} color={iconColor} />}
            <Box style={applyStyle(cryptoIconStyle, { backgroundColor })}>
                <CryptoIcon name={cryptoIconName} size="extraSmall" />
            </Box>
        </Box>
    );
};
