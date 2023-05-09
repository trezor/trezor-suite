import React from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TokenSymbol, TransactionType } from '@suite-common/wallet-types';
import { CoinIcon, Icon, IconName } from '@suite-common/icons';
import { Color } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    symbol: NetworkSymbol | TokenSymbol;
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
    joint: 'shuffle',
    self: 'arrowURightDown',
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
    symbol,
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
                <CoinIcon symbol={symbol} size="extraSmall" />
            </Box>
        </Box>
    );
};
