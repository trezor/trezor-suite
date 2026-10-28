import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

import { injectGetTransactionStoreService } from './createTransactionStoreService';

/** Keys are per account, so a change on one account refetches only that account's queries. */
export const transactionStoreQueryKeys = {
    allTransactions: () => ['transaction-store', 'transactions'],
    accountTransactions: (accountKey: string, variant?: unknown) => [
        'transaction-store',
        'transactions',
        accountKey,
        ...(variant === undefined ? [] : [variant]),
    ],
    syncStatus: (accountKeys?: string[]) => [
        'transaction-store',
        'sync-status',
        ...(accountKeys ?? []),
    ],
};

/** Refetches the store's queries when the worker says their data changed, instead of polling. */
export const useTransactionStoreInvalidation = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribePromise = getTransactionStoreService().transactionStore.subscribe(
            event => {
                if (event.type === 'transactionsChanged') {
                    // Lists over several accounts (e.g. counts) refetch along with the account's.
                    void queryClient.invalidateQueries({
                        queryKey: transactionStoreQueryKeys.allTransactions(),
                        predicate: query =>
                            typeof query.queryKey[2] !== 'string' ||
                            event.accountKeys.includes(query.queryKey[2]),
                    });

                    return;
                }
                void queryClient.invalidateQueries({
                    queryKey: transactionStoreQueryKeys.syncStatus(),
                    predicate: query =>
                        query.queryKey.length === 2 ||
                        query.queryKey.includes(event.status.accountKey),
                });
            },
        );

        return () => {
            void unsubscribePromise.then(unsubscribe => unsubscribe());
        };
    }, [getTransactionStoreService, queryClient]);
};

export const useAccountSyncStatuses = (accountKeys: string[]) => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);

    return useQuery({
        queryKey: transactionStoreQueryKeys.syncStatus(accountKeys),
        queryFn: () => getTransactionStoreService().transactionStore.getSyncStatus(accountKeys),
    });
};
