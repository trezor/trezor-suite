import React from 'react';

import { RequireAllOrNone } from 'type-fest';

import { Box, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Color } from '@trezor/theme';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';

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
        signColor: 'textSecondaryHighlight',
    },
    sent: {
        text: 'Sent',
        iconName: 'send',
        sign: '-',
        signColor: 'textAlertRed',
    },
    contract: {
        text: 'Contract',
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
    const { type } = transaction;

    const { text } = transactionTypeInfo[type];

    const hasTransactionSign = type === 'sent' || type === 'recv';

    return (
        <Box alignItems="center">
            <Box flexDirection="row" alignItems="center" marginBottom="small">
                <Text variant="hint" color="textSubdued">
                    {text}
                </Text>
                {hasTransactionSign && (
                    <Icon
                        name={transactionTypeInfo[type].iconName}
                        color="iconSubdued"
                        size="medium"
                    />
                )}
            </Box>
            <Box flexDirection="row">
                {hasTransactionSign && (
                    <Text variant="titleMedium" color={transactionTypeInfo[type].signColor}>
                        {transactionTypeInfo[type].sign}
                    </Text>
                )}
                <CryptoAmountFormatter
                    value={transaction.amount}
                    network={transaction.symbol}
                    isBalance={false}
                    variant="titleMedium"
                    color="textDefault"
                />
            </Box>
            {transaction.rates && (
                <Box flexDirection="row">
                    <Text>≈ </Text>
                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        customRates={transaction.rates}
                    />
                </Box>
            )}
        </Box>
    );
};
