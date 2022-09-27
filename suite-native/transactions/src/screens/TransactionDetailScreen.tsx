import React from 'react';
import { useSelector } from 'react-redux';

import {
    selectNetworkBlockchainInfo,
    selectTransactionByTxidAndAccount,
} from '@suite-common/wallet-core';
import { formatNetworkAmount, getConfirmations } from '@suite-common/wallet-utils';
import { Box, Divider } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';

import { TransactionDetailAmount } from '../components/TransactionDetail/TransactionDetailAmount';
import { TransactionDetailConfirmations } from '../components/TransactionDetail/TransactionDetailConfirmations';
import { TransactionDetailData } from '../components/TransactionDetail/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetail/TransactionDetailHeader';

export const TransactionDetailScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    const { txid, accountKey } = route.params;
    const transaction = useSelector((state: any) =>
        selectTransactionByTxidAndAccount(state, txid, accountKey),
    );
    const networkBlockchainInfo = useSelector((state: any) =>
        transaction?.symbol ? selectNetworkBlockchainInfo(state, transaction.symbol) : null,
    );

    // TODO please add empty state when design is ready
    if (!transaction) return null;

    const confirmations = networkBlockchainInfo
        ? getConfirmations(transaction, networkBlockchainInfo.blockHeight)
        : 0;
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
