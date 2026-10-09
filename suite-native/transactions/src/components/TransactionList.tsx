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
    selectAccountTransactionsWithNulls,
    selectAreAllAccountTransactionsLoaded,
    selectIsPageAlreadyFetched,
    useDirectRpcHistoryState,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type MonthKey,
    getOlderHistoryFrom,
    groupTransactionsByDate,
    isPending,
} from '@suite-common/wallet-utils';
import { Box, ListItemSkeleton, VStack, useScrollDivider } from '@suite-native/atoms';
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

import { OlderHistoryStatus } from './OlderHistoryStatus';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';
import { TransactionsEmptyState } from './TransactionsEmptyState';
import { TransactionsListFooter } from './TransactionsListFooter';
import { useFetchMissingTransactionFiatRates } from '../hooks/useFetchMissingTransactionFiatRates';
import { getNextRequestedTransactionCount, getOlderHistoryPage } from '../utils';

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
    const directRpcHistoryState = useDirectRpcHistoryState(accountKey);
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

    const [isInitialPageLoaded, setIsInitialPageLoaded] = useState(isFirstPageAlreadyFetched);

    // Count only full cached pages so Load more refetches a partially cached next page.
    // Page 1 is requested separately until its initial fetch succeeds.
    const initialPageNumber = Math.max(1, Math.floor(transactions.length / txnsPerPage));
    const [page, setPage] = useState(initialPageNumber);
    const [hasLoadingOlderFailed, setHasLoadingOlderFailed] = useState(false);
    const isFetchingPageRef = useRef(false);
    // The loader and footer must agree when history ends, even if cached counts differ.
    const hasMoreTransactions =
        !areAllTransactionsLoaded &&
        (!tokenContract || page < Math.ceil(account.history.total / txnsPerPage));
    const shouldDeferEmptyState =
        (!!tokenContract || filter === 'staking' || filter === 'yield') && hasMoreTransactions;
    // Direct-RPC history ends at the scanned window, not the first transaction. Reaching past it is
    // left to the button, as auto-fill would keep scanning back for a token with no transfers.
    const olderHistoryFrom =
        isInitialPageLoaded && !hasMoreTransactions ? getOlderHistoryFrom(account) : undefined;
    const loadedTransactionCount = useSelector(
        (state: TransactionsRootState) =>
            selectAccountTransactionsWithNulls(state, accountKey).length,
    );

    const { scrollDivider, handleScroll } = useScrollDivider();

    const fetchPage = useCallback(
        async (requestedPage: number, from?: number) => {
            // Initial loading, the button, and auto-fill share this lock before React rerenders.
            if (isFetchingPageRef.current) return;
            isFetchingPageRef.current = true;

            try {
                await dispatch(
                    fetchTransactionsPageThunk({
                        accountKey,
                        page: requestedPage,
                        perPage: txnsPerPage,
                        // A widened window changes what the page holds, so a cached copy is stale.
                        forceRefetch: from !== undefined,
                        from,
                    }),
                ).unwrap();
                // Record the page this request fetched, rather than incrementing potentially newer state.
                setPage(requestedPage);
                // A successful partial page also unlocks pagination; shared idle status does not.
                setIsInitialPageLoaded(true);
                setHasLoadingOlderFailed(false);
            } catch {
                // Only a step back has a place to show its failure; a failed page keeps the list as it is.
                setHasLoadingOlderFailed(from !== undefined);
            } finally {
                isFetchingPageRef.current = false;
            }
        },
        [dispatch, accountKey, txnsPerPage],
    );

    const handleOnLoadMore = useCallback(
        () => fetchPage(isInitialPageLoaded ? page + 1 : 1),
        [fetchPage, isInitialPageLoaded, page],
    );

    useEffect(() => {
        if (!isInitialPageLoaded) {
            handleOnLoadMore();
        }
    }, [isInitialPageLoaded, handleOnLoadMore]);

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
    const isHistoryUnscanned = directRpcHistoryState === 'unscanned';
    const historyCoveredSince =
        account.networkType === 'ethereum' ? account.misc.historyCoveredSince : undefined;
    const [requestedVisibleCount, setRequestedVisibleCount] = useState<number>(txnsPerPage);
    const shouldLoadMoreTokenTransactions =
        !!tokenContract &&
        visibleTransactionCount < requestedVisibleCount &&
        shouldDeferEmptyState &&
        fetchStatus !== 'error' &&
        isInitialPageLoaded;

    useEffect(() => {
        // One visible token page may require several account pages after filtering.
        if (shouldLoadMoreTokenTransactions && !isLoadingTransactions) {
            handleOnLoadMore();
        }
    }, [shouldLoadMoreTokenTransactions, isLoadingTransactions, handleOnLoadMore]);

    const handleOnLoadMorePress = () => {
        if (tokenContract) {
            setRequestedVisibleCount(requestedCount =>
                getNextRequestedTransactionCount({
                    requestedCount,
                    visibleCount: visibleTransactionCount,
                    pageSize: txnsPerPage,
                }),
            );
        }
        if (olderHistoryFrom !== undefined) {
            fetchPage(getOlderHistoryPage(loadedTransactionCount, txnsPerPage), olderHistoryFrom);
        } else {
            handleOnLoadMore();
        }
    };

    useFetchMissingTransactionFiatRates({ accountKey, isEnabled: data.length > 0 });

    const getListEmptyComponent = () => {
        if (isHistoryUnscanned) {
            return (
                <VStack spacing="sp8">
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </VStack>
            );
        }

        if (shouldDeferEmptyState) {
            return null;
        }

        return (
            listEmptyComponent ?? (
                <TransactionsEmptyState
                    isRecentWindowEmpty={directRpcHistoryState === 'recentWindowEmpty'}
                />
            )
        );
    };

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
                ListEmptyComponent={getListEmptyComponent()}
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={
                    <TransactionsListFooter
                        hasMoreTransactions={hasMoreTransactions || olderHistoryFrom !== undefined}
                        isOlderHistory={olderHistoryFrom !== undefined}
                        // The skeleton stands in for the loader until the first scan is done.
                        isLoading={
                            !isHistoryUnscanned &&
                            (isLoadingTransactions || shouldLoadMoreTokenTransactions)
                        }
                        onButtonPress={handleOnLoadMorePress}
                    >
                        {olderHistoryFrom !== undefined && (
                            <OlderHistoryStatus
                                historyCoveredSince={historyCoveredSince}
                                hasLoadingFailed={hasLoadingOlderFailed}
                            />
                        )}
                    </TransactionsListFooter>
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
