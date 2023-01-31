import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList } from 'react-native';
import { useSelector } from 'react-redux';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate } from '@suite-common/wallet-utils';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import { TAB_BAR_HEIGHT } from '@suite-native/navigation';

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
    section: { monthKey: string; data: WalletAccountTransaction[] };
    index: number;
    accountKey: AccountKey;
};

type RenderSectionHeaderParams = {
    section: {
        monthKey: string;
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

// NOTE: This is due to Box wrapper that is set by isScrollable prop in suite-native/module-accounts/src/screens/AccountDetailScreen.tsx
// The box doesn't seem to be stopped visually by tab bar and SectionList cmp cannot be inside ScrollView cmp
// That's why we add padding bottom to avoid style clash.
const listWrapperStyle = prepareNativeStyle(_ => ({
    paddingBottom: TAB_BAR_HEIGHT,
    height: '100%',
}));

export const TransactionList = ({
    transactions,
    listHeaderComponent,
    fetchMoreTransactions,
    accountKey,
}: AccountTransactionProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const isLoadingTransactions = useSelector(selectIsLoadingTransactions);
    const accountTransactionsByMonth = useMemo(
        () => groupTransactionsByDate(transactions, 'month'),
        [transactions],
    );
    const transactionMonthKeys = useMemo(
        () => Object.keys(accountTransactionsByMonth),
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

    if (isLoadingTransactions)
        // TODO Temporary loading state just so it's visible that transactions are loading
        return <ActivityIndicator size="large" color={utils.colors.forest} />;

    return (
        <Box style={applyStyle(listWrapperStyle)}>
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
        </Box>
    );
};
