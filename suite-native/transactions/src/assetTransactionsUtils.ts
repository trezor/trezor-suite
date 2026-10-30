import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    generateTransactionDateKey,
    isPending,
    sortByBlockHeight,
} from '@suite-common/wallet-utils';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';

import { getOlderHistoryPage } from './utils';

const PENDING_GROUP_KEY = 'pending';

export type AssetAccountHistory = {
    accountKey: AccountKey;
    transactions: readonly WalletAccountTransaction[];
    hasMoreTransactions: boolean;
    loadedSinceBlockTime?: number;
};

export type AssetTransaction = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
};

export type MergedAssetTransactions = {
    transactions: AssetTransaction[];
    accountKeyToFetch: AccountKey | undefined;
};

export type AssetTransactionListRow = AssetTransaction & {
    isFirstOfDay: boolean;
    isLastOfDay: boolean;
};

export type AssetTransactionListItem = AssetTransactionListRow | string;

const getPosition = (transaction: WalletAccountTransaction, isComparedByBlockTime: boolean) =>
    (isComparedByBlockTime ? transaction.blockTime : transaction.blockHeight) ?? 0;

const getOldestPosition = (
    transactions: readonly WalletAccountTransaction[],
    isComparedByBlockTime: boolean,
) =>
    transactions.reduce(
        (oldest, transaction) =>
            isPending(transaction)
                ? oldest
                : Math.min(oldest, getPosition(transaction, isComparedByBlockTime)),
        Infinity,
    );

export const mergeAssetTransactions = (
    accountHistories: readonly AssetAccountHistory[],
): MergedAssetTransactions => {
    // Only EVM histories are loaded since a block time, and EVM block times never decrease.
    const isComparedByBlockTime = accountHistories.some(
        ({ hasMoreTransactions, loadedSinceBlockTime }) =>
            hasMoreTransactions && loadedSinceBlockTime !== undefined,
    );
    let newestUnloadedPosition = -Infinity;
    let accountKeyToFetch: AccountKey | undefined;

    accountHistories.forEach(
        ({ accountKey, transactions, hasMoreTransactions, loadedSinceBlockTime }) => {
            const loadedDownTo =
                loadedSinceBlockTime ?? getOldestPosition(transactions, isComparedByBlockTime);

            if (hasMoreTransactions && loadedDownTo > newestUnloadedPosition) {
                newestUnloadedPosition = loadedDownTo;
                accountKeyToFetch = accountKey;
            }
        },
    );

    const transactions = accountHistories
        .flatMap(({ accountKey, transactions: accountTransactions }) =>
            accountTransactions
                .filter(
                    transaction =>
                        isPending(transaction) ||
                        getPosition(transaction, isComparedByBlockTime) > newestUnloadedPosition,
                )
                .map(transaction => ({ accountKey, transaction })),
        )
        .toSorted((left, right) => sortByBlockHeight(left.transaction, right.transaction));

    return { transactions, accountKeyToFetch };
};

export type PageRequest = {
    accountKey: AccountKey;
    page: number;
    from?: number;
};

type GetAccountPagingParams = {
    accountKey: AccountKey;
    transactionCount: number;
    loadedTransactionCount: number;
    historyTotal: number;
    areAllTransactionsLoaded: boolean;
    isFirstPageCached: boolean;
    fetchedPage: number | undefined;
    isExhausted: boolean;
    olderHistoryFrom: number | undefined;
    historyCoveredSince: number | undefined;
    perPage: number;
};

export const getAccountPaging = ({
    accountKey,
    transactionCount,
    loadedTransactionCount,
    historyTotal,
    areAllTransactionsLoaded,
    isFirstPageCached,
    fetchedPage,
    isExhausted,
    olderHistoryFrom,
    historyCoveredSince,
    perPage,
}: GetAccountPagingParams) => {
    const cachedFullPageCount = isFirstPageCached ? Math.floor(transactionCount / perPage) : 0;
    const lastFetchedPage = fetchedPage ?? cachedFullPageCount;
    const needsFirstPage = lastFetchedPage === 0;
    const hasMorePages =
        !needsFirstPage &&
        !areAllTransactionsLoaded &&
        !isExhausted &&
        lastFetchedPage < Math.ceil(historyTotal / perPage);
    const hasOlderHistory = !needsFirstPage && !hasMorePages && olderHistoryFrom !== undefined;
    const nextPageRequest: PageRequest = hasOlderHistory
        ? {
              accountKey,
              page: getOlderHistoryPage(loadedTransactionCount, perPage),
              from: olderHistoryFrom,
          }
        : { accountKey, page: lastFetchedPage + 1 };

    return {
        nextPageRequest,
        needsFirstPage,
        hasOlderHistory,
        hasMoreTransactions: needsFirstPage || hasMorePages || hasOlderHistory,
        loadedSinceBlockTime: hasOlderHistory ? historyCoveredSince : undefined,
    };
};

export const getAssetTokenTransfers = (
    transactions: readonly AssetTransaction[],
    tokenContract: TokenAddress,
): AssetTransaction[] =>
    transactions.flatMap(assetTransaction =>
        assetTransaction.transaction.tokens
            .filter(token => token.contract === tokenContract)
            .map(tokenTransfer => ({ ...assetTransaction, tokenTransfer })),
    );

export const takeWholeTransactions = (
    assetTransactions: readonly AssetTransaction[],
    count: number,
): readonly AssetTransaction[] => {
    const lastTransaction = assetTransactions[count - 1]?.transaction;
    const end = assetTransactions.findIndex(
        (row, index) => index >= count && row.transaction !== lastTransaction,
    );

    return end === -1 ? assetTransactions : assetTransactions.slice(0, end);
};

const getDayKey = (transaction: WalletAccountTransaction) =>
    isPending(transaction) || !transaction.blockTime
        ? PENDING_GROUP_KEY
        : generateTransactionDateKey(new Date(transaction.blockTime * 1000));

export const groupAssetTransactionsByDay = (
    newestFirstAssetTransactions: readonly AssetTransaction[],
): AssetTransactionListItem[] => {
    const rowsByDay = new Map<string, AssetTransaction[]>([[PENDING_GROUP_KEY, []]]);
    newestFirstAssetTransactions.forEach(row => {
        const dayKey = getDayKey(row.transaction);
        const dayRows = rowsByDay.get(dayKey);

        if (dayRows) {
            dayRows.push(row);
        } else {
            rowsByDay.set(dayKey, [row]);
        }
    });

    return [...rowsByDay].flatMap(([dayKey, rows]) =>
        rows.length > 0
            ? [
                  dayKey,
                  ...rows.map((row, index) => ({
                      ...row,
                      isFirstOfDay: index === 0,
                      isLastOfDay: index === rows.length - 1,
                  })),
              ]
            : [],
    );
};
