import { useDispatch, useStore } from 'react-redux';

import { mobileQueryKeys, useInfiniteQuery } from '@suite-common/react-query';
import {
    type AccountsRootState,
    type TransactionsRootState,
    fetchTransactionsPageThunk,
    selectAreAllAccountTransactionsLoaded,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseAccountTransactionsPageQueryParams = {
    accountKey: AccountKey;
    perPage: number;
};

export const useAccountTransactionsPageQuery = ({
    accountKey,
    perPage,
}: UseAccountTransactionsPageQueryParams) => {
    const dispatch = useDispatch();
    const store = useStore<TransactionsRootState & AccountsRootState>();

    return useInfiniteQuery({
        queryKey: mobileQueryKeys.accountTransactions(accountKey, perPage),
        queryFn: async ({ pageParam }) => {
            await dispatch(
                fetchTransactionsPageThunk({ accountKey, page: pageParam, perPage }),
            ).unwrap();

            return pageParam;
        },
        initialPageParam: 1,
        getNextPageParam: lastPage => {
            const allLoaded = selectAreAllAccountTransactionsLoaded(store.getState(), accountKey);

            return allLoaded ? undefined : lastPage + 1;
        },
        // Override the global refetchOnMount:false so the first page is fetched
        // on mount when there is no cached data. The staleTime:Infinity ensures
        // that subsequent mounts with cached data do not trigger an extra round-trip.
        refetchOnMount: true,
        staleTime: Infinity,
        gcTime: Infinity,
    });
};
