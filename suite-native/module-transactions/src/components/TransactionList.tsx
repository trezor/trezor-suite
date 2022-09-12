import React from 'react';
import { ActivityIndicator } from 'react-native';

import { A } from '@mobily/ts-belt';

import { useNativeStyles } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate } from '@suite-common/wallet-utils';

import { TransactionListItem } from './TransactionListItem';
import { TransactionListGroup } from './TransactionListGroup';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
};

export const TransactionList = ({ transactions }: AccountTransactionProps) => {
    const { utils } = useNativeStyles();
    const accountTransactionsByDate = groupTransactionsByDate(transactions);
    const transactionDateKeys = Object.keys(accountTransactionsByDate);

    if (A.isEmpty(transactionDateKeys))
        // TODO Temporary loading state just so it's visible that transactions are loading
        return <ActivityIndicator size="large" color={utils.colors.forest} />;

    return (
        <>
            {transactionDateKeys.map(dateKey => (
                <TransactionListGroup dateKey={dateKey} key={dateKey}>
                    {accountTransactionsByDate[dateKey].map(transaction => (
                        <TransactionListItem key={transaction.txid} transaction={transaction} />
                    ))}
                </TransactionListGroup>
            ))}
        </>
    );
};
