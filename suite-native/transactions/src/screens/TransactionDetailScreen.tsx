import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Divider } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { selectBlockchainState, selectTransactionByTxid } from '@suite-common/wallet-core';
import { formatNetworkAmount, getConfirmations } from '@suite-common/wallet-utils';

import { TransactionDetailHeader } from '../components/TransactionDetail/TransactionDetailHeader';
import { TransactionDetailData } from '../components/TransactionDetail/TransactionDetailData';
import { TransactionDetailConfirmations } from '../components/TransactionDetail/TransactionDetailConfirmations';
import { TransactionDetailAmount } from '../components/TransactionDetail/TransactionDetailAmount';

export const TransactionDetailScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    const { txid } = route.params;
    const transaction = useSelector(selectTransactionByTxid(txid));
    const blockchain = useSelector(selectBlockchainState);

    // TODO please add empty state when design is ready
    if (!transaction) return null;

    const confirmations = getConfirmations(transaction, blockchain[transaction.symbol].blockHeight);
    const totalAmount = formatNetworkAmount(transaction.amount, transaction.symbol, true);

    return (
        <Screen header={<ScreenHeader />}>
            <TransactionDetailHeader type={transaction.type} amount={totalAmount} />
            <Box marginVertical="large">
                <Divider />
            </Box>
            <TransactionDetailData transaction={transaction} />
            <Box marginVertical="large">
                <Divider />
            </Box>
            <TransactionDetailConfirmations confirmations={confirmations} />
            <Box marginVertical="large" />
            <TransactionDetailAmount transaction={transaction} />
        </Screen>
    );
};
