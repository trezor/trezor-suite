import { useCallback, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { type AssetDetailState, selectWalletAssetAccountKeys } from '@suite-common/assets';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type TokensRootState } from '@suite-native/tokens';
import {
    getNextRequestedTransactionCount,
    transactionsToTokenMetadataSources,
    useFetchMissingTransactionFiatRates,
    useRefreshAccounts,
} from '@suite-native/transactions';

import { selectWalletAssetAccountHistories } from '../assetTransactionsSelectors';
import { useAccountPageFetching } from './useAccountPageFetching';
import { useRefreshAssetPrice } from './useRefreshAssetPrice';
import { getAssetTransactionsView } from '../utils/getAssetTransactionsView';

type UseAssetTransactionsParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const useAssetTransactions = ({
    networkSymbol,
    tokenContract,
}: UseAssetTransactionsParams) => {
    const perPage = getTxsPerPage(getNetworkType(networkSymbol));

    const accountHistories = useSelector(
        (state: AssetDetailState & TokensRootState) =>
            selectWalletAssetAccountHistories(state, networkSymbol, tokenContract, perPage),
        shallowEqual,
    );
    const assetAccountKeys = useSelector((state: AssetDetailState) =>
        selectWalletAssetAccountKeys(state, networkSymbol, tokenContract),
    );

    const [visibleCount, setVisibleCount] = useState<number>(perPage);
    const {
        fetchedPageByAccount,
        exhaustedAccountKeys,
        failedAccountKeys,
        isFetching,
        fetchAccountPageBatch,
        clearFailedAccountKeys,
        reopenHistories,
    } = useAccountPageFetching(perPage);
    const refreshAssetPrice = useRefreshAssetPrice({ networkSymbol, tokenContract });
    const { isRefreshing, refreshAccountsAndLatestTransactions } = useRefreshAccounts({
        accountKeys: accountHistories.map(accountHistory => accountHistory.accountKey),
        perPage,
        onRefresh: refreshAssetPrice,
    });

    const {
        items,
        visibleRowCount,
        hasMoreTransactions,
        needsOlderHistoryScan,
        historyCoveredSince,
        hasLoadingFailed,
        isEmptyStateDeferred,
        olderHistoryPageRequest,
        automaticPageRequests,
    } = getAssetTransactionsView({
        accountHistories,
        fetchedPageByAccount,
        exhaustedAccountKeys,
        failedAccountKeys,
        visibleCount,
        tokenContract,
        perPage,
    });

    const tokenMetadataSources = transactionsToTokenMetadataSources(
        items.flatMap(item => (typeof item === 'string' ? [] : [item.transaction])),
    );

    useFocusEffect(
        useCallback(
            function fetchMissingPages() {
                if (!isFetching && !isRefreshing && automaticPageRequests.length > 0) {
                    fetchAccountPageBatch(automaticPageRequests);
                }
            },
            [isFetching, isRefreshing, automaticPageRequests, fetchAccountPageBatch],
        ),
    );

    useFetchMissingTransactionFiatRates({ accountKeys: assetAccountKeys });

    const loadMore = () => {
        clearFailedAccountKeys();
        setVisibleCount(requestedCount =>
            getNextRequestedTransactionCount({
                requestedCount,
                visibleCount: visibleRowCount,
                pageSize: perPage,
            }),
        );

        if (olderHistoryPageRequest && !isFetching) {
            fetchAccountPageBatch([olderHistoryPageRequest]);
        }
    };

    const refresh = () => {
        reopenHistories();
        refreshAccountsAndLatestTransactions();
    };

    const isLoading = isFetching || automaticPageRequests.length > 0;

    return {
        items,
        tokenMetadataSources,
        hasMoreTransactions,
        needsOlderHistoryScan,
        historyCoveredSince,
        hasLoadingFailed,
        isEmptyStateDeferred,
        isInitialLoading: isLoading && items.length === 0,
        isLoadingMore: isLoading && items.length > 0,
        isRefreshing,
        loadMore,
        refresh,
    };
};
