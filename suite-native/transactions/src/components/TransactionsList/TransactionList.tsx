import React, { useEffect, useState } from 'react';
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
    fetchMoreTransactions: (nextPage: number, perPage: number) => Promise<void>;
};

export const TX_PER_PAGE = 25;

export const TransactionList = ({
    transactions,
    accountName,
    account,
    fetchMoreTransactions,
}: AccountTransactionProps) => {
    const { utils } = useNativeStyles();
    const accountTransactionsByDate = groupTransactionsByDate(transactions);
    const transactionDateKeys = Object.keys(accountTransactionsByDate);
    // Little math to find out initial page number because if lot of transactions are already loaded it would fuck up the pagination
    // if we start with 1
    const initialPageNumber = Math.ceil((transactions.length || 1) / TX_PER_PAGE);
    const [page, setPage] = useState(initialPageNumber);

    useEffect(() => {
        // it's okay to hardcode 1 because this is initial fetch and in case transactions are already loaded, nothing will happen anyway
        // because of the check in fetchMoreTransactionsThunk
        fetchMoreTransactions(1, TX_PER_PAGE);
    }, [fetchMoreTransactions]);

    const handleEndReached = async () => {
        try {
            // We need to try + await this because if we increase number and then fetch will fail, we will won't be able to fetch these transactions
            // ever again and page will be skipped. Not it will at least somehow manage errors because if it fails and user scrolls up and down agai
            // it will try to refetch page.
            await fetchMoreTransactions(page + 1, TX_PER_PAGE);
            setPage((currentPage: number) => currentPage + 1);
        } catch (error) {
            // TODO handle error states (show retry button or something)
        }
    };

    // Why is this function? Should be just just variable in useMemo
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
            onEndReached={handleEndReached}
        />
    );
};
