import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList } from 'react-native';

import { A } from '@mobily/ts-belt';

import { useNativeStyles } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate } from '@suite-common/wallet-utils';

import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    fetchMoreTransactions: (pageToFetch: number, perPage: number) => void;
    listHeaderComponent: JSX.Element;
};

export const TX_PER_PAGE = 25;

export const TransactionList = ({
    transactions,
    listHeaderComponent,
    fetchMoreTransactions,
}: AccountTransactionProps) => {
    const { utils } = useNativeStyles();
    const accountTransactionsByDate = useMemo(
        () => groupTransactionsByDate(transactions),
        [transactions],
    );
    const transactionDateKeys = useMemo(
        () => Object.keys(accountTransactionsByDate),
        [accountTransactionsByDate],
    );
    const initialPageNumber = Math.ceil((transactions.length || 1) / TX_PER_PAGE);
    const [page, setPage] = useState(initialPageNumber);

    useEffect(() => {
        // it's okay to hardcode 1 because this is initial fetch and in case transactions are already loaded, nothing will happen anyway
        // because of the check in fetchMoreTransactionsThunk
        fetchMoreTransactions(1, TX_PER_PAGE);
    }, [fetchMoreTransactions]);

    const handleOnEndReached = useCallback(async () => {
        try {
            await fetchMoreTransactions(page + 1, TX_PER_PAGE);
            setPage((currentPage: number) => currentPage + 1);
        } catch (e) {
            // TODO handle error state (show retry button or something
        }
    }, [fetchMoreTransactions, page]);

    const sectionsData = useMemo(
        () =>
            transactionDateKeys.map(dateKey => ({
                dateKey,
                data: [...accountTransactionsByDate[dateKey]],
            })),
        [accountTransactionsByDate, transactionDateKeys],
    );

    const renderItem = useCallback(
        ({ item }) => <TransactionListItem key={item.txid} transaction={item} />,
        [],
    );

    const renderSectionHeader = useCallback(
        ({ section: { dateKey } }) => <TransactionListGroupTitle dateKey={dateKey} key={dateKey} />,
        [],
    );

    if (A.isEmpty(transactionDateKeys))
        // TODO Temporary loading state just so it's visible that transactions are loading
        return <ActivityIndicator size="large" color={utils.colors.forest} />;

    return (
        <SectionList
            sections={sectionsData}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            ListHeaderComponent={listHeaderComponent}
            onEndReached={handleOnEndReached}
        />
    );
};
