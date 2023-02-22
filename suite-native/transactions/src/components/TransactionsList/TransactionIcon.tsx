import React from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CryptoIcon, CryptoIconName, Icon, IconName } from '@trezor/icons';
import { colorVariants } from '@trezor/theme';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    cryptoIconName: CryptoIconName;
    transactionType: TransactionType;
    isAnimated?: boolean;
};

const ICON_SIZE = 48;

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'receive',
    sent: 'send',
    joint: 'placeholder',
    self: 'placeholder',
    failed: 'placeholder',
    unknown: 'placeholder',
};

type TransactionIconStyleProps = {
    isAnimated: boolean;
};

const transactionIconStyle = prepareNativeStyle<TransactionIconStyleProps>(
    (utils, { isAnimated }) => ({
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: utils.colors[isAnimated ? 'gray1000' : 'gray100'],
        borderRadius: utils.borders.radii.round,
        padding: 14.5,
    }),
);

const cryptoIconStyle = prepareNativeStyle<TransactionIconStyleProps>((utils, { isAnimated }) => ({
    position: 'absolute',
    right: -2,
    bottom: -2,
    padding: 2,
    backgroundColor: utils.colors[isAnimated ? 'gray1000' : 'gray0'],
    borderRadius: utils.borders.radii.round,
}));

export const TransactionIcon = ({
    cryptoIconName,
    transactionType,
    isAnimated = false,
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedIconColor = colorVariants.standard.yellow;

    return (
        <Box>
            <Box style={applyStyle(transactionIconStyle, { isAnimated })}>
                <Icon
                    name={transactionIconMap[transactionType]}
                    color={isAnimated ? animatedIconColor : 'gray600'}
                    size="mediumLarge"
                />
            </Box>
            {isAnimated && (
                <TransactionIconSpinner radius={ICON_SIZE / 2} color={animatedIconColor} />
            )}
            <Box style={applyStyle(cryptoIconStyle, { isAnimated })}>
                <CryptoIcon name={cryptoIconName} size="extraSmall" />
            </Box>
        </Box>
    );
};
