import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { type AccountHistory } from '../assetTransactionsSelectors';
import {
    type PageRequest,
    getAccountPaging,
    getAssetTokenTransfers,
    groupAssetTransactionsByDay,
    mergeAssetTransactions,
    takeWholeTransactions,
} from './assetTransactionsUtils';

type PagedAccountHistory = AccountHistory &
    ReturnType<typeof getAccountPaging> & {
        hasFailed: boolean;
    };

type GetAutomaticPageRequestsParams = {
    pagedAccountHistories: readonly PagedAccountHistory[];
    accountHistoryToFetch: PagedAccountHistory | undefined;
    needsOlderHistoryScan: boolean;
    rowCount: number;
    visibleCount: number;
};

export const getAutomaticPageRequests = ({
    pagedAccountHistories,
    accountHistoryToFetch,
    needsOlderHistoryScan,
    rowCount,
    visibleCount,
}: GetAutomaticPageRequestsParams): PageRequest[] => {
    const firstPageRequests = pagedAccountHistories
        .filter(accountHistory => accountHistory.needsFirstPage && !accountHistory.hasFailed)
        .map(accountHistory => accountHistory.nextPageRequest);

    if (firstPageRequests.length > 0) return firstPageRequests;

    const isNextPageNeeded =
        !!accountHistoryToFetch &&
        !accountHistoryToFetch.hasFailed &&
        !needsOlderHistoryScan &&
        rowCount < visibleCount;

    return isNextPageNeeded ? [accountHistoryToFetch.nextPageRequest] : [];
};

type GetAssetTransactionsViewParams = {
    accountHistories: readonly AccountHistory[];
    fetchedPageByAccount: Partial<Record<AccountKey, number>>;
    exhaustedAccountKeys: ReadonlySet<AccountKey>;
    failedAccountKeys: ReadonlySet<AccountKey>;
    visibleCount: number;
    tokenContract: TokenAddress | undefined;
    perPage: number;
};

export const getAssetTransactionsView = ({
    accountHistories,
    fetchedPageByAccount,
    exhaustedAccountKeys,
    failedAccountKeys,
    visibleCount,
    tokenContract,
    perPage,
}: GetAssetTransactionsViewParams) => {
    const pagedAccountHistories = accountHistories.map((accountHistory): PagedAccountHistory => ({
        ...accountHistory,
        ...getAccountPaging({
            ...accountHistory,
            loadedTransactionCount: accountHistory.transactions.length,
            fetchedPage: fetchedPageByAccount[accountHistory.accountKey],
            isExhausted: exhaustedAccountKeys.has(accountHistory.accountKey),
            perPage,
        }),
        hasFailed: failedAccountKeys.has(accountHistory.accountKey),
    }));

    const { transactions, accountKeyToFetch } = mergeAssetTransactions(
        pagedAccountHistories.filter(
            accountHistory => accountHistory.isAssetAccount || accountHistory.needsFirstPage,
        ),
    );
    const rows = tokenContract ? getAssetTokenTransfers(transactions, tokenContract) : transactions;
    const visibleRows = takeWholeTransactions(rows, visibleCount);
    const areAllRowsVisible = visibleRows.length === rows.length;

    const accountHistoryToFetch = pagedAccountHistories.find(
        accountHistory => accountHistory.accountKey === accountKeyToFetch,
    );
    const needsOlderHistoryScan = areAllRowsVisible && !!accountHistoryToFetch?.hasOlderHistory;
    const hasMoreTransactions = !areAllRowsVisible || accountKeyToFetch !== undefined;
    const hasLoadingFailed = failedAccountKeys.size > 0;
    const mayHaveUnloadedTokenTransfers =
        !!tokenContract && hasMoreTransactions && !needsOlderHistoryScan;

    return {
        items: groupAssetTransactionsByDay(visibleRows),
        visibleRowCount: visibleRows.length,
        hasMoreTransactions,
        needsOlderHistoryScan,
        historyCoveredSince: accountHistoryToFetch?.historyCoveredSince,
        hasLoadingFailed,
        isEmptyStateDeferred: mayHaveUnloadedTokenTransfers || hasLoadingFailed,
        olderHistoryPageRequest: needsOlderHistoryScan
            ? accountHistoryToFetch?.nextPageRequest
            : undefined,
        automaticPageRequests: getAutomaticPageRequests({
            pagedAccountHistories,
            accountHistoryToFetch,
            needsOlderHistoryScan,
            rowCount: rows.length,
            visibleCount,
        }),
    };
};
