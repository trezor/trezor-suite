import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@suite-common/react-query';
import type { SelectTransactionsParams } from '@suite-common/transaction-store';
import { useServices } from '@trezor/dependency-injection';

import { injectGetTransactionStoreService } from './createTransactionStoreService';

const transactionStoreQueryKeys = {
    transactions: (params?: SelectTransactionsParams) => [
        'transaction-store',
        'transactions',
        ...(params === undefined ? [] : [params]),
    ],
    syncStatus: (accountKeys?: string[]) => [
        'transaction-store',
        'sync-status',
        ...(accountKeys === undefined ? [] : [accountKeys]),
    ],
};

/** Refetches the store's queries when the worker says their data changed, instead of polling. */
export const useTransactionStoreInvalidation = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribePromise = getTransactionStoreService().transactionStore.subscribe(
            event => {
                const queryKey =
                    event.type === 'transactionsChanged'
                        ? transactionStoreQueryKeys.transactions()
                        : transactionStoreQueryKeys.syncStatus();
                void queryClient.invalidateQueries({ queryKey });
            },
        );

        return () => {
            void unsubscribePromise.then(unsubscribe => unsubscribe());
        };
    }, [getTransactionStoreService, queryClient]);
};

/** A page of the stored history; keep `limit` small, the rows are copied from the worker. */
export const useStoredTransactions = (params: SelectTransactionsParams) => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);

    return useQuery({
        queryKey: transactionStoreQueryKeys.transactions(params),
        queryFn: () => getTransactionStoreService().transactionStore.selectTransactions(params),
    });
};

export const useAccountSyncStatuses = (accountKeys: string[]) => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);

    return useQuery({
        queryKey: transactionStoreQueryKeys.syncStatus(accountKeys),
        queryFn: () => getTransactionStoreService().transactionStore.getSyncStatus(accountKeys),
    });
};
