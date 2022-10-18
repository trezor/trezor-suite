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
import { formatNetworkAmount, getConfirmations, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useFormatters } from '@suite-common/formatters';

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
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { CryptoAmountFormatter, CurrencySymbolFormatter } = useFormatters();

    // TODO please add empty state when design is ready
    if (!transaction) return null;

    const confirmations = getConfirmations(transaction, blockchain[transaction.symbol].blockHeight);

    const transactionAmount = formatNetworkAmount(transaction.amount, transaction.symbol);
    const fiatAmount = toFiatCurrency(transactionAmount, fiatCurrency.label, transaction.rates);
    const cryptoAmountFormatted = `${CryptoAmountFormatter.format(transactionAmount, {
        symbol: transaction.symbol,
    })} ${CurrencySymbolFormatter.format(transaction.symbol)}`;

    return (
        <Screen header={<ScreenHeader />}>
            <TransactionDetailHeader
                type={transaction.type}
                amount={cryptoAmountFormatted}
                fiatAmount={fiatAmount}
            />
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
