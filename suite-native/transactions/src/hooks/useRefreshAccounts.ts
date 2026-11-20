import { useState } from 'react';

import { fetchAndUpdateAccountThunk, fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

// It's usually too fast so the loading indicator would only flash for a moment.
const MIN_REFRESHING_DURATION_MS = 1500;

type UseRefreshAccountsParams = {
    accountKeys: readonly AccountKey[];
    perPage: number;
    onRefresh?: () => Promise<unknown>;
};

export const useRefreshAccounts = ({
    accountKeys,
    perPage,
    onRefresh,
}: UseRefreshAccountsParams) => {
    const { dispatch } = useServices(injectDispatch);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshAccountsAndLatestTransactions = async () => {
        setIsRefreshing(true);
        await Promise.allSettled([
            ...accountKeys.flatMap(accountKey => [
                dispatch(fetchAndUpdateAccountThunk({ accountKey })),
                dispatch(
                    fetchTransactionsPageThunk({
                        accountKey,
                        page: 1,
                        perPage,
                        forceRefetch: true,
                    }),
                ),
            ]),
            onRefresh?.(),
        ]);
        setTimeout(() => setIsRefreshing(false), MIN_REFRESHING_DURATION_MS);
    };

    return { isRefreshing, refreshAccountsAndLatestTransactions };
};
