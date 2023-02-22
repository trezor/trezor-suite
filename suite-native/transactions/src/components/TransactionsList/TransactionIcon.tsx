import React from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CryptoIcon, CryptoIconName, Icon, IconName } from '@trezor/icons';
import { colorVariants } from '@trezor/theme';
import { AppColorScheme } from '@suite-native/module-settings';

import { TransactionIconSpinner } from './TransactionIconSpinner';

type TransactionIconProps = {
    cryptoIconName: CryptoIconName;
    transactionType: TransactionType;
    colorScheme?: AppColorScheme;
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
    colorScheme: AppColorScheme;
};

const transactionIconStyle = prepareNativeStyle<TransactionIconStyleProps>(
    (utils, { colorScheme }) => ({
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: utils.colors[colorScheme === 'dark' ? 'gray1000' : 'gray100'],
        borderRadius: utils.borders.radii.round,
        padding: 14.5,
    }),
);

const cryptoIconStyle = prepareNativeStyle<TransactionIconStyleProps>((utils, { colorScheme }) => ({
    position: 'absolute',
    right: -2,
    bottom: -2,
    padding: 2,
    backgroundColor: utils.colors[colorScheme === 'dark' ? 'gray1000' : 'gray0'],
    borderRadius: utils.borders.radii.round,
}));

export const TransactionIcon = ({
    cryptoIconName,
    transactionType,
    isAnimated = false,
    colorScheme = 'standard',
}: TransactionIconProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedIconColor =
        colorScheme === 'dark' ? colorVariants.dark.yellow : colorVariants.standard.yellow;

    return (
        <Box>
            <Box style={applyStyle(transactionIconStyle, { colorScheme })}>
                <Icon
                    name={transactionIconMap[transactionType]}
                    color={isAnimated ? animatedIconColor : 'gray600'}
                    size="mediumLarge"
                />
            </Box>
            {isAnimated && (
                <TransactionIconSpinner
                    cryptoIconName={cryptoIconName}
                    radius={ICON_SIZE / 2}
                    color={animatedIconColor}
                />
            )}

            <Box style={applyStyle(cryptoIconStyle, { colorScheme })}>
                <CryptoIcon name={cryptoIconName} size="extraSmall" />
            </Box>
        </Box>
    );
};
