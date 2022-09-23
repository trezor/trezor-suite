import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AccountsStackParamList,
    AccountsStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import {
    AccountsRootState,
    fetchTransactionsThunk,
    selectAccountLabel,
    selectAccountByKey,
    TransactionsRootState,
    selectAccountTransactions,
} from '@suite-common/wallet-core';
import { TransactionList } from '@suite-native/transactions';
import { useMount } from '@suite-common/wallet-utils';

const TX_PER_PAGE = 25;

export const AccountDetailScreen = ({
    route,
}: StackProps<AccountsStackParamList, AccountsStackRoutes.AccountDetail>) => {
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountName = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, accountKey),
    );
    const accountTransactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey),
    );
    const [page, setPage] = useState(1);
    const dispatch = useDispatch();

    const fetchMoreTransactions = () => {
        if (!account) return;
        dispatch(
            fetchTransactionsThunk({
                account,
                page,
                perPage: TX_PER_PAGE,
            }),
        );
        setPage(page + 1);
    };

    useMount(() => {
        fetchMoreTransactions();
    });

    const paginatedTransactions = accountTransactions.slice(1, TX_PER_PAGE * page);

    if (!account) return null;

    return (
        <Screen header={<ScreenHeader />} isScrollable={false}>
            <TransactionList
                account={account}
                accountName={accountName}
                transactions={paginatedTransactions}
                fetchMoreTransactions={fetchMoreTransactions}
            />
        </Screen>
    );
};
