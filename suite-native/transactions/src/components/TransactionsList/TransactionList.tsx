import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate, MonthKey } from '@suite-common/wallet-utils';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { Loader } from '@suite-native/atoms';

import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';
import { TransactionsEmptyState } from '../TransactionsEmptyState';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    fetchMoreTransactions: (pageToFetch: number, perPage: number) => void;
    listHeaderComponent: JSX.Element;
    accountKey: string;
};

type RenderItemParams = {
    item: WalletAccountTransaction;
    section: { monthKey: MonthKey; data: WalletAccountTransaction[] };
    index: number;
    accountKey: AccountKey;
};

type RenderSectionHeaderParams = {
    section: {
        monthKey: MonthKey;
    };
};

const renderItem = ({ item, section, index, accountKey }: RenderItemParams) => (
    <TransactionListItem
        key={item.txid}
        transaction={item}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        accountKey={accountKey}
    />
);

const renderSectionHeader = ({ section: { monthKey } }: RenderSectionHeaderParams) => (
    <TransactionListGroupTitle key={monthKey} monthKey={monthKey} />
);

export const TX_PER_PAGE = 25;

export const TransactionList = ({
    transactions,
    listHeaderComponent,
    fetchMoreTransactions,
    accountKey,
}: AccountTransactionProps) => {
    const isLoadingTransactions = useSelector(selectIsLoadingTransactions);
    const accountTransactionsByMonth = useMemo(
        () => groupTransactionsByDate(transactions, 'month'),
        [transactions],
    );

    const transactionMonthKeys = useMemo(
        () => Object.keys(accountTransactionsByMonth) as MonthKey[],
        [accountTransactionsByMonth],
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
            transactionMonthKeys.map(monthKey => ({
                monthKey,
                data: [...accountTransactionsByMonth[monthKey]],
            })),
        [accountTransactionsByMonth, transactionMonthKeys],
    );

    if (isLoadingTransactions) return <Loader />;

    return (
        <SectionList
            sections={sectionsData}
            renderItem={({ item, section, index }) =>
                renderItem({ item, section, index, accountKey })
            }
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={<TransactionsEmptyState accountKey={accountKey} />}
            ListHeaderComponent={listHeaderComponent}
            onEndReached={handleOnEndReached}
            stickySectionHeadersEnabled={false}
        />
    );
};
