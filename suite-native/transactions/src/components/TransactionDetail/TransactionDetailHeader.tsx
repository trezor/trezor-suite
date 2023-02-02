import React from 'react';

import { RequireAllOrNone } from 'type-fest';

import { Box, DiscreetText, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { useFormatters } from '@suite-common/formatters';
import { Color } from '@trezor/theme';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
};

type TransactionTypeInfo = {
    text: string;
    iconName: IconName;
    sign?: string;
    signColor?: Color;
};

const transactionTypeInfo = {
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
    self: {
        text: 'Self',
    },
    joint: {
        text: 'Joint',
    },
    failed: {
        text: 'Failed',
    },
    unknown: {
        text: 'Unknown',
    },
} as const satisfies Record<
    TransactionType,
    RequireAllOrNone<TransactionTypeInfo, 'sign' | 'signColor' | 'iconName'>
>;

export const TransactionDetailHeader = ({ transaction }: TransactionDetailHeaderProps) => {
    const { CryptoAmountFormatter } = useFormatters();
    const { type } = transaction;

    const { text } = transactionTypeInfo[type];

    const hasTransactionSign = type === 'sent' || type === 'recv';

    return (
        <Box alignItems="center">
            <Box flexDirection="row" alignItems="center" marginBottom="small">
                <Text variant="hint" color="gray600">
                    {text}
                </Text>
                {hasTransactionSign && (
                    <Icon name={transactionTypeInfo[type].iconName} color="gray600" size="medium" />
                )}
            </Box>
            <Box flexDirection="row">
                {hasTransactionSign && (
                    <Text variant="titleMedium" color={transactionTypeInfo[type].signColor}>
                        {transactionTypeInfo[type].sign}
                    </Text>
                )}
                <DiscreetText typography="titleMedium">
                    {CryptoAmountFormatter.format(transaction.amount, {
                        symbol: transaction.symbol,
                    })}
                </DiscreetText>
            </Box>
            <Text>
                ≈
                <CryptoToFiatAmountFormatter
                    value={transaction.amount}
                    network={transaction.symbol}
                    customRates={transaction.rates}
                />
            </Text>
        </Box>
    );
};
