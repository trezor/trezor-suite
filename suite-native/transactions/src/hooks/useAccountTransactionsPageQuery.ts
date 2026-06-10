import { useDispatch } from 'react-redux';

import { mobileQueryKeys, useQuery } from '@suite-common/react-query';
import { fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseAccountTransactionsPageQueryParams = {
    accountKey: AccountKey;
    page: number;
    perPage: number;
};

export const useAccountTransactionsPageQuery = ({
    accountKey,
    page,
    perPage,
}: UseAccountTransactionsPageQueryParams) => {
    const dispatch = useDispatch();

    return useQuery({
        queryKey: mobileQueryKeys.accountTransactions(accountKey, page, perPage),
        queryFn: () =>
            dispatch(fetchTransactionsPageThunk({ accountKey, page, perPage })).unwrap(),
        staleTime: Infinity,
        gcTime: Infinity,
    });
};
