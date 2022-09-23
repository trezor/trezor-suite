import React from 'react';
import { ActivityIndicator, SectionList } from 'react-native';

import { A } from '@mobily/ts-belt';

import { useNativeStyles } from '@trezor/styles';
import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { AccountBalance } from '@suite-native/accounts';

import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    accountName?: string;
    account: Account;
    fetchMoreTransactions: () => void;
};

export const TransactionList = ({
    transactions,
    accountName,
    account,
    fetchMoreTransactions,
}: AccountTransactionProps) => {
    const { utils } = useNativeStyles();
    const accountTransactionsByDate = groupTransactionsByDate(transactions);
    const transactionDateKeys = Object.keys(accountTransactionsByDate);

    const formatSectionData = () => {
        const sectionsData: { dateKey: string; data: WalletAccountTransaction[] }[] = [];
        transactionDateKeys.forEach(dateKey => {
            sectionsData.push({ dateKey, data: [...accountTransactionsByDate[dateKey]] });
        });
        return sectionsData;
    };

    if (A.isEmpty(transactionDateKeys))
        // TODO Temporary loading state just so it's visible that transactions are loading
        return <ActivityIndicator size="large" color={utils.colors.forest} />;

    return (
        <SectionList
            sections={formatSectionData()}
            renderSectionHeader={({ section: { dateKey } }) => (
                <TransactionListGroupTitle key={dateKey} dateKey={dateKey} />
            )}
            renderItem={({ item }) => <TransactionListItem key={item.txid} transaction={item} />}
            ListHeaderComponent={
                <>
                    <AccountBalance accountName={accountName} account={account} />
                    <Box marginBottom="large">
                        <Text variant="titleSmall">Transactions</Text>
                    </Box>
                </>
            }
            onEndReached={fetchMoreTransactions}
        />
    );
};
