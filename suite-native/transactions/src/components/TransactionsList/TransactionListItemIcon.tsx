import React from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TransactionType } from '@suite-common/wallet-types';
import { CryptoIcon, CryptoIconName, Icon, IconName } from '@trezor/icons';

type TransactionListItemIconProps = {
    cryptoIconName: CryptoIconName;
    transactionType: TransactionType;
};

const transactionIconMap: Record<TransactionType, IconName> = {
    recv: 'receive',
    sent: 'send',
    contract: 'placeholder',
    joint: 'placeholder',
    self: 'placeholder',
    failed: 'placeholder',
    unknown: 'placeholder',
};

const transactionIconStyle = prepareNativeStyle(utils => ({
    width: 48,
    height: 48,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    borderRadius: utils.borders.radii.round,
    padding: 14.5,
}));

const cryptoIconStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
}));

export const TransactionListItemIcon = ({
    cryptoIconName,
    transactionType,
}: TransactionListItemIconProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box>
            <Box style={applyStyle(transactionIconStyle)}>
                <Icon
                    name={transactionIconMap[transactionType]}
                    color="iconSubdued"
                    size="mediumLarge"
                />
            </Box>
            <Box style={applyStyle(cryptoIconStyle)}>
                <CryptoIcon name={cryptoIconName} size="extraSmall" />
            </Box>
        </Box>
    );
};
