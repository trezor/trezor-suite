import React from 'react';

import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType } from '@suite-common/wallet-types';
import { useFormatters } from '@suite-common/formatters';
import { Color } from '@trezor/theme';

type TransactionDetailHeaderProps = {
    type: TransactionType;
    amount: string;
    fiatAmount: string | null;
};

type TransactionTypeInfo = {
    text: string;
    iconName: IconName;
    sign: string;
    signColor: Color;
};

const transactionTypeInfo: Partial<Record<TransactionType, TransactionTypeInfo>> = {
    recv: {
        text: 'Received',
        iconName: 'receive',
        sign: '+',
        signColor: 'forest',
    },
    sent: {
        text: 'Sending',
        iconName: 'send',
        sign: '-',
        signColor: 'red',
    },
};

export const TransactionDetailHeader = ({
    type,
    amount,
    fiatAmount,
}: TransactionDetailHeaderProps) => {
    const { FiatAmountFormatter } = useFormatters();
    return (
        <Box alignItems="center">
            <Box flexDirection="row" alignItems="center" marginBottom="small">
                <Text variant="hint" color="gray600">
                    {transactionTypeInfo[type]?.text}
                </Text>
                <Icon
                    name={transactionTypeInfo[type]?.iconName ?? 'placeholder'}
                    color="gray600"
                    size="medium"
                />
            </Box>
            <Box flexDirection="row">
                <Text variant="titleMedium" color={transactionTypeInfo[type]?.signColor}>
                    {transactionTypeInfo[type]?.sign}
                </Text>
                <DiscreetText typography="titleMedium">{amount}</DiscreetText>
            </Box>
            <DiscreetText typography="label" color="gray700">
                {`≈  ${FiatAmountFormatter.format(fiatAmount ?? 0)}`}
            </DiscreetText>
        </Box>
    );
};
