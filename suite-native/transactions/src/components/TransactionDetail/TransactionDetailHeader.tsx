import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionDetailHeaderProps = {
    type: TransactionType;
    amount: string;
};

const transactionTypeTextMap: Partial<Record<TransactionType, string>> = {
    recv: 'received',
    sent: 'sent',
};

const transactionIconMap: Partial<Record<TransactionType, IconName>> = {
    recv: 'receive',
    sent: 'send',
};

const transactionTypeStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleSmall,
    textTransform: 'capitalize',
    color: utils.colors.forest,
}));

export const TransactionDetailHeader = ({ type, amount }: TransactionDetailHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <>
            <Box flexDirection="row" marginBottom="small">
                <Icon
                    name={transactionIconMap[type] ?? 'placeholder'}
                    color="forest"
                    size="large"
                />
                <Text style={applyStyle(transactionTypeStyle)}>{transactionTypeTextMap[type]}</Text>
            </Box>
            <Text variant="titleMedium">{amount}</Text>
        </>
    );
};
