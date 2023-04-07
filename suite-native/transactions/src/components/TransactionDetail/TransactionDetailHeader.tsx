import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';

import { signValueMap } from '../TransactionsList/TransactionListItem';

type TransactionDetailHeaderProps = {
    transaction: WalletAccountTransaction;
};

type TransactionTypeInfo = {
    text: string;
    iconName?: IconName;
};

const transactionTypeInfo = {
    recv: {
        text: 'Received',
        iconName: 'receive',
    },
    sent: {
        text: 'Sent',
        iconName: 'send',
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
} as const satisfies Record<TransactionType, TransactionTypeInfo>;

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
            <Text variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit>
                <SignValueFormatter value={signValueMap[transaction.type]} variant="titleMedium" />
                <CryptoAmountFormatter
                    value={transaction.amount}
                    network={transaction.symbol}
                    isBalance={false}
                    variant="titleMedium"
                    color="textDefault"
                    signValue={signValueMap[transaction.type]}
                />
            </Text>
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
