import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AssetDetailState } from '@suite-common/assets';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { selectBaseCurrency, updateMissingTxFiatRatesThunk } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState } from '@suite-native/tokens';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    areAccountHistoriesEqual,
    selectWalletAssetAccountHistories,
} from '../assetTransactionsSelectors';
import { useAccountPageFetching } from './useAccountPageFetching';
import { useRefreshAccounts } from './useRefreshAccounts';
import {
    getAccountPaging,
    getAssetTokenTransfers,
    groupAssetTransactionsByDay,
    mergeAssetTransactions,
    takeWholeTransactions,
} from '../utils/assetTransactionsUtils';

type UseAssetTransactionsParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const useAssetTransactions = ({
    networkSymbol,
    tokenContract,
}: UseAssetTransactionsParams) => {
    const { dispatch } = useServices(injectDispatch);
    const perPage = getTxsPerPage(getNetworkType(networkSymbol));

    const accountHistories = useSelector(
        (state: AssetDetailState & TokensRootState) =>
            selectWalletAssetAccountHistories(state, { networkSymbol, tokenContract, perPage }),
        areAccountHistoriesEqual,
    );
    const localCurrency = useSelector(selectBaseCurrency);

    const [visibleCount, setVisibleCount] = useState<number>(perPage);
    const {
        fetchedPageByAccount,
        exhaustedAccountKeys,
        failedAccountKeys,
        isFetching,
        fetchAccountPageBatch,
        retryFailed,
        reopenHistories,
    } = useAccountPageFetching(perPage);
    const { isRefreshing, refreshAccountsAndLatestTransactions } = useRefreshAccounts({
        accountKeys: accountHistories.map(accountHistory => accountHistory.accountKey),
        perPage,
    });

    const pagedAccountHistories = accountHistories.map(accountHistory => {
        const paging = getAccountPaging({
            ...accountHistory,
            transactionCount: accountHistory.transactions.length,
            fetchedPage: fetchedPageByAccount[accountHistory.accountKey],
            isExhausted: exhaustedAccountKeys.has(accountHistory.accountKey),
            perPage,
        });

        return {
            ...accountHistory,
            ...paging,
            hasFailed: failedAccountKeys.has(accountHistory.accountKey),
            mayHaveAssetTransactions: accountHistory.isAssetAccount || paging.needsFirstPage,
        };
    });

    const { transactions: mergedTransactions, accountKeyToFetch } = mergeAssetTransactions(
        pagedAccountHistories.filter(accountHistory => accountHistory.mayHaveAssetTransactions),
    );
    const rows = tokenContract
        ? getAssetTokenTransfers(mergedTransactions, tokenContract)
        : mergedTransactions;
    const visibleRows = takeWholeTransactions(rows, visibleCount);
    const items = groupAssetTransactionsByDay(visibleRows);
    const areAllRowsVisible = visibleRows.length === rows.length;

    const accountHistoryToFetch = pagedAccountHistories.find(
        accountHistory => accountHistory.accountKey === accountKeyToFetch,
    );
    const needsOlderHistoryScan = areAllRowsVisible && !!accountHistoryToFetch?.hasOlderHistory;

    const getAccountHistoriesToFetch = () => {
        const firstPageAccountHistories = pagedAccountHistories.filter(
            accountHistory => accountHistory.needsFirstPage && !accountHistory.hasFailed,
        );

        if (firstPageAccountHistories.length > 0) return firstPageAccountHistories;
        if (!accountHistoryToFetch || accountHistoryToFetch.hasFailed || needsOlderHistoryScan)
            return [];

        return rows.length < visibleCount ? [accountHistoryToFetch] : [];
    };
    const pageRequests = getAccountHistoriesToFetch().map(
        accountHistory => accountHistory.nextPageRequest,
    );

    useEffect(
        function fetchMissingPages() {
            if (!isFetching && pageRequests.length > 0) {
                fetchAccountPageBatch(pageRequests);
            }
        },
        [isFetching, pageRequests, fetchAccountPageBatch],
    );

    useEffect(
        function fetchMissingFiatRates() {
            accountHistories
                .filter(accountHistory => accountHistory.isAssetAccount)
                .forEach(({ accountKey }) =>
                    dispatch(updateMissingTxFiatRatesThunk({ localCurrency, accountKey })),
                );
        },
        [dispatch, localCurrency, accountHistories],
    );

    const loadMore = () => {
        retryFailed();
        setVisibleCount(count => count + perPage);

        if (needsOlderHistoryScan && accountHistoryToFetch && !isFetching) {
            fetchAccountPageBatch([accountHistoryToFetch.nextPageRequest]);
        }
    };

    const refresh = () => {
        reopenHistories();
        refreshAccountsAndLatestTransactions();
    };

    return {
        items,
        hasMoreTransactions: !areAllRowsVisible || accountKeyToFetch !== undefined,
        needsOlderHistoryScan,
        historyCoveredSince: accountHistoryToFetch?.historyCoveredSince,
        hasLoadingFailed: failedAccountKeys.size > 0,
        isLoading: isFetching || pageRequests.length > 0,
        isRefreshing,
        loadMore,
        refresh,
    };
};
