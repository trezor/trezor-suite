import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    fetchAndUpdateAccountThunk,
    fetchTransactionsPageThunk,
    selectAccountTransactionsFetchStatus,
    selectAreAllAccountTransactionsLoaded,
    selectIsPageAlreadyFetched,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type MonthKey, groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Box } from '@suite-native/atoms';
import { useScrollDivider } from '@suite-native/scrollview';
import {
    type TokensRootState,
    type TypedTokenTransfer,
    type WalletAccountTransaction,
    selectAccountStakeTypeTransactionsWithTokenTransfers,
    selectAccountTransactionsWithTokenTransfers,
    selectAccountYieldTypeTransactionsWithTokenTransfers,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { arrayPartition } from '@trezor/utils';

import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';
import { TransactionsEmptyState } from './TransactionsEmptyState';
import { TransactionsListFooter } from './TransactionsListFooter';
import { useFetchMissingTransactionFiatRates } from '../hooks/useFetchMissingTransactionFiatRates';

type RenderSectionHeaderParams = {
    section: {
        monthKey: MonthKey;
    };
};

type RenderTransactionItemParams = {
    item: WalletAccountTransaction;
    accountKey: AccountKey;

    isFirst: boolean;
    isLast: boolean;
};

type RenderTokenTransferItemParams = Omit<RenderTransactionItemParams, 'item'> & {
    item: TypedTokenTransferWithTx;
};

type TypedTokenTransferWithTx = TypedTokenTransfer & {
    originalTransaction: WalletAccountTransaction;
};

type TransactionListItem =
    (TypedTokenTransferWithTx | MonthKey) | (WalletAccountTransaction | MonthKey);

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp8,
}));

const listFooterStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp32,
}));

const sortKeysPendingFirst = (a: string, b: string) => {
    if (a === 'pending' && b === 'pending') return 0;
    if (a === 'pending') return -1;
    if (b === 'pending') return 1;

    const dateA = new Date(a);
    const dateB = new Date(b);

    return dateB.getTime() - dateA.getTime();
};

const sortPendingTransactions = (a: WalletAccountTransaction, b: WalletAccountTransaction) => {
    if (a.blockTime === undefined && b.blockTime === undefined) return 0;
    if (a.blockTime === undefined) return -1;
    if (b.blockTime === undefined) return 1;

    return a.blockTime - b.blockTime;
};

const renderTransactionItem = ({
    item,
    isFirst,
    isLast,
    accountKey,
}: RenderTransactionItemParams) => (
    <TransactionListItem
        transaction={item}
        isFirst={isFirst}
        isLast={isLast}
        accountKey={accountKey}
    />
);

const renderTokenTransferItem = ({
    item: tokenTransfer,
    isLast,
    isFirst,
    accountKey,
}: RenderTokenTransferItemParams) => (
    <TokenTransferListItem
        transaction={tokenTransfer.originalTransaction}
        tokenTransfer={tokenTransfer}
        accountKey={accountKey}
        isFirst={isFirst}
        isLast={isLast}
    />
);

const renderSectionHeader = ({ section: { monthKey } }: RenderSectionHeaderParams) => (
    <TransactionListGroupTitle key={monthKey} monthKey={monthKey} />
);

type AccountTransactionProps = {
    listHeaderComponent: JSX.Element;
    listEmptyComponent?: JSX.Element;
    account: Account;
    tokenContract?: TokenAddress;
    filter?: 'all' | 'staking' | 'yield';
};

export const TransactionList = ({
    listHeaderComponent,
    listEmptyComponent,
    account,
    tokenContract,
    filter = 'all',
}: AccountTransactionProps) => {
    const accountKey = account.key;
    const { dispatch } = useServices(injectDispatch);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();

    const fetchStatus = useSelector(
        (state: TransactionsRootState) =>
            selectAccountTransactionsFetchStatus(state, accountKey)?.status,
    );
    const isLoadingTransactions = fetchStatus === 'loading';
    const areAllTransactionsLoaded = useSelector(
        (state: TransactionsRootState & AccountsRootState) =>
            selectAreAllAccountTransactionsLoaded(state, accountKey),
    );

    const transactions = useSelector((state: TransactionsRootState & TokensRootState) => {
        switch (filter) {
            case 'all':
                return selectAccountTransactionsWithTokenTransfers(state, accountKey);
            case 'staking':
                return selectAccountStakeTypeTransactionsWithTokenTransfers(state, accountKey);
            case 'yield':
                return selectAccountYieldTypeTransactionsWithTokenTransfers(state, accountKey);
            default:
                return [] as WalletAccountTransaction[];
        }
    });

    const txnsPerPage = getTxsPerPage(account.networkType);

    const isFirstPageAlreadyFetched = useSelector((state: TransactionsRootState) =>
        selectIsPageAlreadyFetched(state, accountKey, 1, txnsPerPage),
    );

    // Count only full cached pages so Load more refetches a partially cached next page.
    // Start at page 1 because the effect below handles the initial page fetch separately.
    const initialPageNumber = Math.max(1, Math.floor(transactions.length / txnsPerPage));
    const [page, setPage] = useState(initialPageNumber);
    const isLoadingMoreRef = useRef(false);
    // The loader and footer must agree when history ends, even if cached counts differ.
    const hasMoreTransactions =
        !areAllTransactionsLoaded &&
        (!tokenContract || page < Math.ceil(account.history.total / txnsPerPage));
    const shouldDeferEmptyState =
        (!!tokenContract || filter === 'staking' || filter === 'yield') && hasMoreTransactions;

    const { scrollDivider, handleScroll } = useScrollDivider();

    useEffect(() => {
        // We need to check manually if the first page was already fetched, because fetchTransactionsPageThunk will
        // always force refetch the first page, but we want to save resources and not do that if it's not necessary.
        if (!isFirstPageAlreadyFetched) {
            dispatch(fetchTransactionsPageThunk({ accountKey, page: 1, perPage: txnsPerPage }));
        }
    }, [dispatch, accountKey, isFirstPageAlreadyFetched, txnsPerPage]);

    const handleOnLoadMore = useCallback(async () => {
        // The button and auto-fill effect share this lock; loading state updates on the next render.
        if (isLoadingMoreRef.current) return;
        isLoadingMoreRef.current = true;

        try {
            await dispatch(
                fetchTransactionsPageThunk({ accountKey, page: page + 1, perPage: txnsPerPage }),
            ).unwrap();
            // Record the page this request fetched, rather than incrementing potentially newer state.
            setPage(page + 1);
        } catch {
            // TODO handle error state (show retry button or something
        } finally {
            isLoadingMoreRef.current = false;
        }
    }, [dispatch, accountKey, page, txnsPerPage]);

    const handleOnRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await Promise.allSettled([
                dispatch(fetchAndUpdateAccountThunk({ accountKey })),
                dispatch(
                    fetchTransactionsPageThunk({
                        accountKey,
                        page: 1,
                        perPage: txnsPerPage,
                        forceRefetch: true,
                    }),
                ),
            ]);
        } catch {
            // Do nothing
        }
        // It's usually too fast so loading indicator only flashes for a moment, which is not nice
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [dispatch, accountKey, txnsPerPage]);

    const data = useMemo((): TransactionListItem[] => {
        // groupTransactionsByDate now sorts also pending transactions, if they have blockTime set.
        // This is here to keep the original behavior of having pending transactions in one group
        // at the beginning of the list.
        const [pendingTxs, confirmedTxs] = arrayPartition(transactions, isPending);
        const accountTransactionsByMonth = groupTransactionsByDate(confirmedTxs, 'month');
        if (pendingTxs.length || accountTransactionsByMonth['no-blocktime']) {
            accountTransactionsByMonth['pending'] = [
                ...(accountTransactionsByMonth['no-blocktime'] ?? []),
                ...pendingTxs.sort(sortPendingTransactions),
            ];
            delete accountTransactionsByMonth['no-blocktime'];
        }

        const transactionMonthKeys = Object.keys(accountTransactionsByMonth).sort(
            sortKeysPendingFirst,
        ) as MonthKey[];

        if (tokenContract) {
            return transactionMonthKeys.flatMap(monthKey => {
                const tokenTransfers = (accountTransactionsByMonth[monthKey] ?? []).flatMap(
                    transaction =>
                        transaction.tokens
                            .filter(token => token.contract === tokenContract)
                            .map(
                                tokenTransfer =>
                                    ({
                                        ...tokenTransfer,
                                        originalTransaction: transaction,
                                    }) as TypedTokenTransferWithTx,
                            ),
                );

                // Months without any transfer of the token are dropped entirely, so an account
                // with no transactions of the token results in empty data and shows the empty state.
                return tokenTransfers.length > 0 ? [monthKey, ...tokenTransfers] : [];
            });
        }

        return transactionMonthKeys.flatMap(monthKey => [
            monthKey,
            ...(accountTransactionsByMonth[monthKey] ?? []),
        ]) as TransactionListItem[];
    }, [transactions, tokenContract]);

    const visibleTransactionCount = data.filter(item => typeof item !== 'string').length;
    const [requestedVisibleCount, setRequestedVisibleCount] = useState(txnsPerPage);
    const shouldLoadMoreTokenTransactions =
        !!tokenContract &&
        visibleTransactionCount < requestedVisibleCount &&
        shouldDeferEmptyState &&
        fetchStatus !== 'error' &&
        (isFirstPageAlreadyFetched || fetchStatus === 'idle');

    useEffect(() => {
        // One visible token page may require several account pages after filtering.
        if (shouldLoadMoreTokenTransactions && !isLoadingTransactions) {
            handleOnLoadMore();
        }
    }, [shouldLoadMoreTokenTransactions, isLoadingTransactions, handleOnLoadMore]);

    const handleOnLoadMorePress = () => {
        if (tokenContract) {
            setRequestedVisibleCount(visibleTransactionCount + txnsPerPage);
        }
        handleOnLoadMore();
    };

    useFetchMissingTransactionFiatRates({ accountKey, isEnabled: data.length > 0 });

    const renderItem = useCallback(
        ({ item, index }: { item: TransactionListItem; index: number }) => {
            if (typeof item === 'string') {
                // month with only month name and without token txn
                const isEmptyMonth = typeof data.at(index + 1) === 'string' || !data.at(index + 1);

                return isEmptyMonth ? null : renderSectionHeader({ section: { monthKey: item } });
            }

            const isFirstInSection = typeof data.at(index - 1) === 'string';
            const isLastInSection =
                typeof data.at(index + 1) === 'string' || index === data.length - 1;

            const getIsTokenTransfer = (
                itemForCheck: TransactionListItem,
            ): itemForCheck is TypedTokenTransferWithTx => 'originalTransaction' in itemForCheck;

            return getIsTokenTransfer(item)
                ? renderTokenTransferItem({
                      item,
                      accountKey,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  })
                : renderTransactionItem({
                      item,
                      accountKey,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  });
        },
        [data, accountKey],
    );

    return (
        <Box flex={1}>
            {scrollDivider}
            <FlashList<TransactionListItem>
                data={data}
                renderItem={renderItem}
                contentContainerStyle={applyStyle(sectionListContainerStyle)}
                ListEmptyComponent={
                    shouldDeferEmptyState
                        ? null
                        : (listEmptyComponent ?? <TransactionsEmptyState />)
                }
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={
                    <TransactionsListFooter
                        hasMoreTransactions={hasMoreTransactions}
                        isLoading={isLoadingTransactions || shouldLoadMoreTokenTransactions}
                        onButtonPress={handleOnLoadMorePress}
                    />
                }
                ListFooterComponentStyle={applyStyle(listFooterStyle)}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleOnRefresh}
                        colors={[colors.elementFillBrandBold]}
                    />
                }
                refreshing={isRefreshing}
                onScroll={handleScroll}
            />
        </Box>
    );
};
