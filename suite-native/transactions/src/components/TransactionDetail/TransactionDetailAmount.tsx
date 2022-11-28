import React from 'react';

import { Box, Card, DiscreetValue, Divider, Text } from '@suite-native/atoms';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

type TransactionDetailAmountProps = {
    transaction: WalletAccountTransaction;
};

const TransactionDetailAmountRow = ({ title, value }: { title: string; value: string }) => (
    <Box flexDirection="row" justifyContent="space-between">
        <Text>{title}</Text>
        <DiscreetValue color="forest">{value}</DiscreetValue>
    </Box>
);

export const TransactionDetailAmount = ({ transaction }: TransactionDetailAmountProps) => {
    const totalInput = formatNetworkAmount(
        transaction.details.totalInput,
        transaction.symbol,
        true,
    );
    const totalOutput = formatNetworkAmount(
        transaction.details.totalOutput,
        transaction.symbol,
        true,
    );
    const fee = formatNetworkAmount(transaction.fee, transaction.symbol, true);
    const totalAmount = formatNetworkAmount(transaction.amount, transaction.symbol, true);

    return (
        <Box>
            <Box marginBottom="medium">
                <Text color="gray800">Amount</Text>
            </Box>
            <Card>
                <TransactionDetailAmountRow title="Input" value={totalInput} />
                <TransactionDetailAmountRow title="Output" value={totalOutput} />
                <TransactionDetailAmountRow title="Fee" value={fee} />
                <Box marginVertical="small">
                    <Divider />
                </Box>
                <TransactionDetailAmountRow title="Total" value={totalAmount} />
            </Card>
        </Box>
    );
};
