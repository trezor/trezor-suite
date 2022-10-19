import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList } from 'react-native';
import { useSelector } from 'react-redux';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate } from '@suite-common/wallet-utils';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { Text, Box } from '@suite-native/atoms';
import { TAB_BAR_HEIGHT } from '@suite-native/navigation';

import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    transactions: WalletAccountTransaction[];
    fetchMoreTransactions: (pageToFetch: number, perPage: number) => void;
    listHeaderComponent: JSX.Element;
};

export const TX_PER_PAGE = 25;

const listWrapperStyle = prepareNativeStyle(_ => ({
    paddingBottom: TAB_BAR_HEIGHT,
}));

export const TransactionList = ({
    transactions,
    listHeaderComponent,
    fetchMoreTransactions,
}: AccountTransactionProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const isLoadingTransactions = useSelector(selectIsLoadingTransactions);
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

    interface RenderItemParams {
        item: WalletAccountTransaction;
    }

    const renderItem = useCallback(
        ({ item }: RenderItemParams) => <TransactionListItem key={item.txid} transaction={item} />,
        [],
    );

    interface RenderSectionHeaderParams {
        section: {
            dateKey: string;
        };
    }

    const renderSectionHeader = useCallback(
        ({ section: { dateKey } }: RenderSectionHeaderParams) => (
            <TransactionListGroupTitle key={dateKey} dateKey={dateKey} />
        ),
        [],
    );

    if (isLoadingTransactions)
        // TODO Temporary loading state just so it's visible that transactions are loading
        return <ActivityIndicator size="large" color={utils.colors.forest} />;


    return (
        <Box style={applyStyle(listWrapperStyle)}>
            <SectionList
                sections={sectionsData}
                renderSectionHeader={renderSectionHeader}
                renderItem={renderItem}
                ListHeaderComponent={listHeaderComponent}
                ListEmptyComponent={<Text>No transactions.</Text>}
                onEndReached={handleOnEndReached}
            />
        </Box>
    );
};
