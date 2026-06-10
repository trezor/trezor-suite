import { type JSX, useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { FlashList } from '@shopify/flash-list';

import { mobileQueryKeys, useQueryClient } from '@suite-common/react-query';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    fetchAndUpdateAccountThunk,
    selectAccountByKey,
    selectAreAllAccountTransactionsLoaded,
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
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { arrayPartition } from '@trezor/utils';

// Pre-fetch rates for this many data items beyond the last visible one.
const RATE_PREFETCH_BUFFER = 30;

// Stable reference — a new object on every render resets FlashList's internal viewability state.
const VIEWABILITY_CONFIG = {
    minimumViewTime: 200,
    itemVisiblePercentThreshold: 50,
};

import { useAccountTransactionsPageQuery } from '../hooks/useAccountTransactionsPageQuery';
import { useFiatRatesForTransactionsQuery } from '../hooks/useFiatRatesForTransactionsQuery';

import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';
import { TransactionsEmptyState } from './TransactionsEmptyState';
import { TransactionsListFooter } from './TransactionsListFooter';

type AccountTransactionProps = {
    listHeaderComponent: JSX.Element;
    account: Account;
    tokenContract?: TokenAddress;
    stakingOnly?: boolean;
};

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
    | (TypedTokenTransferWithTx | MonthKey)
    | (WalletAccountTransaction | MonthKey);

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp8,
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

export const TransactionList = ({
    listHeaderComponent,
    account,
    tokenContract,
    stakingOnly = false,
}: AccountTransactionProps) => {
    const accountKey = account.key;
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const shouldDeferEmptyState = useSelector(
        (state: TransactionsRootState & AccountsRootState) =>
            stakingOnly && !selectAreAllAccountTransactionsLoaded(state, accountKey),
    );

    const transactions = useSelector((state: TransactionsRootState & TokensRootState) =>
        stakingOnly
            ? selectAccountStakeTypeTransactionsWithTokenTransfers(state, accountKey)
            : selectAccountTransactionsWithTokenTransfers(state, accountKey),
    );

    const txnsPerPage = getTxsPerPage(account.networkType);

    const {
        isLoading: isLoadingTransactions,
        isFetchingNextPage,
        fetchNextPage,
    } = useAccountTransactionsPageQuery({
        accountKey,
        perPage: txnsPerPage,
    });

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
            return transactionMonthKeys.flatMap(monthKey => [
                monthKey,
                ...(accountTransactionsByMonth[monthKey] ?? []).flatMap(transaction =>
                    transaction.tokens
                        .filter(token => token.contract === tokenContract)
                        .map(
                            tokenTransfer =>
                                ({
                                    ...tokenTransfer,
                                    originalTransaction: transaction,
                                }) as TypedTokenTransferWithTx,
                        ),
                ),
            ]);
        }

        return transactionMonthKeys.flatMap(monthKey => [
            monthKey,
            ...(accountTransactionsByMonth[monthKey] ?? []),
        ]) as TransactionListItem[];
    }, [transactions, tokenContract]);

    // Tracks the highest data-array index that has ever been visible. Using a ref to
    // avoid triggering re-renders on every scroll event; state is only updated when
    // the index actually increases so the derived memo stays stable.
    const lastVisibleIndexRef = useRef(0);
    const [lastVisibleIndex, setLastVisibleIndex] = useState(0);

    const handleViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
            const max = viewableItems.reduce(
                (m, { index }) => Math.max(m, index ?? 0),
                0,
            );
            if (max > lastVisibleIndexRef.current) {
                lastVisibleIndexRef.current = max;
                setLastVisibleIndex(max);
            }
        },
        [],
    );

    // Extract unique WalletAccountTransaction objects for items up to the current
    // viewport + prefetch buffer. Rates for off-screen items are fetched lazily as
    // the user scrolls toward them.
    const transactionsForRates = useMemo(() => {
        const visibleWindow = data.slice(0, lastVisibleIndex + RATE_PREFETCH_BUFFER + 1);
        const seen = new Set<string>();
        const result: WalletAccountTransaction[] = [];
        for (const item of visibleWindow) {
            if (typeof item === 'string') continue;
            const tx =
                'originalTransaction' in item
                    ? item.originalTransaction
                    : (item as WalletAccountTransaction);
            if (!seen.has(tx.txid)) {
                seen.add(tx.txid);
                result.push(tx);
            }
        }
        return result;
    }, [data, lastVisibleIndex]);

    useFiatRatesForTransactionsQuery({
        accountKey,
        transactions: transactionsForRates,
        enabled: transactionsForRates.length > 0,
    });

    const { scrollDivider, handleScroll } = useScrollDivider();

    const handleOnLoadMore = useCallback(() => {
        fetchNextPage();
    }, [fetchNextPage]);

    const handleOnRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await Promise.allSettled([
                dispatch(fetchAndUpdateAccountThunk({ accountKey })),
                // resetQueries clears all cached pages so the infinite query restarts from page 1.
                queryClient.resetQueries({
                    queryKey: mobileQueryKeys.accountTransactions(accountKey, txnsPerPage),
                }),
            ]);
        } catch {
            // Do nothing
        }
        // It's usually too fast so loading indicator only flashes for a moment, which is not nice
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [dispatch, accountKey, queryClient, txnsPerPage]);

    const keyExtractor = useCallback(
        (item: TransactionListItem): string => {
            if (typeof item === 'string') return `month:${item}`;
            if ('originalTransaction' in item) {
                return `token:${item.originalTransaction.txid}:${item.contract}`;
            }
            return `tx:${item.txid}`;
        },
        [],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: TransactionListItem; index: number }) => {
            if (typeof item === 'string') {
                // month with only month name and without token txn
                const isEmptyMonth = typeof data.at(index + 1) === 'string' || !data.at(index + 1);

                return isEmptyMonth
                    ? null
                    : renderSectionHeader({ section: { monthKey: item as MonthKey } });
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
                keyExtractor={keyExtractor}
                estimatedItemSize={80}
                viewabilityConfig={VIEWABILITY_CONFIG}
                onViewableItemsChanged={handleViewableItemsChanged}
                contentContainerStyle={applyStyle(sectionListContainerStyle)}
                ListEmptyComponent={
                    shouldDeferEmptyState ? null : (
                        <TransactionsEmptyState accountKey={accountKey} />
                    )
                }
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={
                    <TransactionsListFooter
                        accountKey={accountKey}
                        isLoading={isLoadingTransactions || isFetchingNextPage}
                        onButtonPress={handleOnLoadMore}
                    />
                }
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleOnRefresh}
                        colors={[colors.legacyBackgroundPrimaryDefault]}
                    />
                }
                refreshing={isRefreshing}
                onScroll={handleScroll}
            />
        </Box>
    );
};
