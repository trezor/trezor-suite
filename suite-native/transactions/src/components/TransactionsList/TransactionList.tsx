import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import {
    fetchAndUpdateAccountThunk,
    fetchTransactionsPageThunk,
    selectIsLoadingAccountTransactions,
    selectIsPageAlreadyFetched,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { groupTransactionsByDate, isPending, MonthKey } from '@suite-common/wallet-utils';
import { Box, Loader } from '@suite-native/atoms';
import {
    TypedTokenTransfer,
    selectAccountOrTokenTransactions,
    WalletAccountTransaction,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { arrayPartition } from '@trezor/utils';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';

import { TransactionsEmptyState } from '../TransactionsEmptyState';
import { TokenTransferListItem } from './TokenTransferListItem';
import { TransactionListGroupTitle } from './TransactionListGroupTitle';
import { TransactionListItem } from './TransactionListItem';

type AccountTransactionProps = {
    areTokensIncluded: boolean;
    listHeaderComponent: JSX.Element;
    accountKey: string;
    tokenContract?: TokenAddress;
};

type RenderSectionHeaderParams = {
    section: {
        monthKey: MonthKey;
    };
};

type RenderTransactionItemParams = {
    item: WalletAccountTransaction;
    accountKey: AccountKey;
    areTokensIncluded: boolean;
    isFirst: boolean;
    isLast: boolean;
};

type TypedTokenTransferWithTx = TypedTokenTransfer & {
    originalTransaction: WalletAccountTransaction;
};

type RenderTokenTransferItemParams = Omit<
    RenderTransactionItemParams,
    'areTokensIncluded' | 'item'
> & {
    item: TypedTokenTransferWithTx;
    txid: string;
};

type TransactionListItem =
    | (TypedTokenTransferWithTx | MonthKey)
    | (WalletAccountTransaction | MonthKey);

const sectionListStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp8,
    flex: 1,
}));

const sectionListContainerStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp8,
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
    areTokensIncluded,
}: RenderTransactionItemParams) => (
    <TransactionListItem
        transaction={item}
        isFirst={isFirst}
        isLast={isLast}
        accountKey={accountKey}
        areTokensIncluded={areTokensIncluded}
    />
);

const renderTokenTransferItem = ({
    item: tokenTransfer,
    isLast,
    isFirst,
    accountKey,
    txid,
}: RenderTokenTransferItemParams) => (
    <TokenTransferListItem
        transaction={tokenTransfer.originalTransaction}
        tokenTransfer={tokenTransfer}
        txid={txid}
        accountKey={accountKey}
        isFirst={isFirst}
        isLast={isLast}
    />
);

const renderSectionHeader = ({ section: { monthKey } }: RenderSectionHeaderParams) => (
    <TransactionListGroupTitle key={monthKey} monthKey={monthKey} />
);

export const TX_PER_PAGE = 25;

export const TransactionList = ({
    areTokensIncluded,
    listHeaderComponent,
    accountKey,
    tokenContract,
}: AccountTransactionProps) => {
    const dispatch = useDispatch();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        applyStyle,
        utils: { colors },
    } = useNativeStyles();
    const isLoadingTransactions = useSelector((state: TransactionsRootState) =>
        selectIsLoadingAccountTransactions(state, accountKey),
    );

    const transactions = useSelector((state: TransactionsRootState & TokenDefinitionsRootState) =>
        selectAccountOrTokenTransactions(
            state,
            accountKey,
            tokenContract ?? null,
            areTokensIncluded,
        ),
    );
    const isLoaderVisible = isLoadingTransactions && transactions.length === 0;
    const isFirstPageAlreadyFetched = useSelector((state: TransactionsRootState) =>
        selectIsPageAlreadyFetched(state, accountKey, 1, TX_PER_PAGE),
    );

    const initialPageNumber = Math.ceil((transactions.length || 1) / TX_PER_PAGE);
    const [page, setPage] = useState(initialPageNumber);

    useEffect(() => {
        // We need to check manually if the first page was already fetched, because fetchTransactionsPageThunk will
        // awalys force refetch the first page, but we want to save resources and not do that if it's not necessary.
        if (!isFirstPageAlreadyFetched) {
            dispatch(fetchTransactionsPageThunk({ accountKey, page: 1, perPage: TX_PER_PAGE }));
        }
    }, [dispatch, accountKey, isFirstPageAlreadyFetched]);

    const handleOnEndReached = useCallback(async () => {
        try {
            await dispatch(fetchTransactionsPageThunk({ accountKey, page, perPage: TX_PER_PAGE }));
            setPage((currentPage: number) => currentPage + 1);
        } catch {
            // TODO handle error state (show retry button or something
        }
    }, [page, accountKey, dispatch]);

    const handleOnRefresh = useCallback(async () => {
        try {
            setIsRefreshing(true);
            await Promise.allSettled([
                dispatch(fetchAndUpdateAccountThunk({ accountKey })),
                dispatch(
                    fetchTransactionsPageThunk({
                        accountKey,
                        page: 1,
                        perPage: TX_PER_PAGE,
                        forceRefetch: true,
                    }),
                ),
            ]);
        } catch {
            // Do nothing
        }
        // It's usually too fast so loading indicator only flashes for a moment, which is not nice
        setTimeout(() => setIsRefreshing(false), 1500);
    }, [dispatch, accountKey]);

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
                ...accountTransactionsByMonth[monthKey].flatMap(transaction =>
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
            ...accountTransactionsByMonth[monthKey],
        ]) as TransactionListItem[];
    }, [transactions, tokenContract]);

    const renderItem = useCallback(
        ({ item, index }: { item: TransactionListItem; index: number }) => {
            if (typeof item === 'string') {
                return renderSectionHeader({ section: { monthKey: item as MonthKey } });
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
                      txid: item.originalTransaction.txid,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  })
                : renderTransactionItem({
                      item,
                      accountKey,
                      areTokensIncluded,
                      isFirst: isFirstInSection,
                      isLast: isLastInSection,
                  });
        },
        [data, accountKey, areTokensIncluded],
    );

    return (
        <Box style={applyStyle(sectionListStyle)}>
            <FlashList<TransactionListItem>
                data={data}
                renderItem={renderItem}
                contentContainerStyle={applyStyle(sectionListContainerStyle)}
                ListEmptyComponent={<TransactionsEmptyState accountKey={accountKey} />}
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={isLoaderVisible ? <Loader /> : null}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleOnRefresh}
                        colors={[colors.backgroundPrimaryDefault]}
                    />
                }
                estimatedItemSize={72}
                refreshing={isRefreshing}
                onEndReached={handleOnEndReached}
            />
        </Box>
    );
};
