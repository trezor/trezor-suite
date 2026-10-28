import { useEffect, useMemo } from 'react';

import { useQuery } from '@suite-common/react-query';
import type { AccountSyncStatus } from '@suite-common/transaction-store';
import type { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { injectGetTransactionStoreService } from './createTransactionStoreService';
import {
    transactionStoreQueryKeys,
    useTransactionStoreInvalidation,
} from './transactionStoreQueries';

export type UseStoredAccountTransactionsParams = {
    account: Account;
    /** 1 is the newest page. */
    page: number;
    perPage: number;
};

export type StoredAccountTransactions = {
    /** The page, pending transactions first, ready for the transaction list. */
    transactions: WalletAccountTransaction[];
    /** How many transactions the store holds for the account, which may be short of its history. */
    storedCount: number;
    syncStatus: AccountSyncStatus | undefined;
    /** Nothing to show yet: the page is loading, or the first sync has not brought anything. */
    isLoading: boolean;
    isSyncing: boolean;
    /** Asks the store for the account's whole history, page by page in its worker. */
    requestFullHistory: () => void;
};

/**
 * An account's history from the transaction store, a page at a time. Refetches when the store
 * reports the account's rows or sync status changed; the store keeps them fresh on its own.
 */
export const useStoredAccountTransactions = ({
    account,
    page,
    perPage,
}: UseStoredAccountTransactionsParams): StoredAccountTransactions => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const { transactionStore } = getTransactionStoreService();
    const accountKey = account.key;

    useTransactionStoreInvalidation();

    // Opening the list is a reason to catch up now, rather than at the next block.
    useEffect(() => {
        void transactionStore.requestSync({ accountKeys: [accountKey], mode: 'latest' });
    }, [transactionStore, accountKey]);

    const rows = useQuery({
        queryKey: transactionStoreQueryKeys.accountTransactions(accountKey, { page, perPage }),
        queryFn: () =>
            transactionStore.selectTransactions({
                accountKeys: [accountKey],
                limit: perPage,
                offset: (page - 1) * perPage,
            }),
        // The previous page stays on screen while the next one is read from the worker.
        placeholderData: previous => previous,
    });
    const storedCount = useQuery({
        queryKey: transactionStoreQueryKeys.accountTransactions(accountKey, 'count'),
        queryFn: async () => {
            const result = await transactionStore.query({
                sql: 'SELECT COUNT(*) AS count FROM transactions WHERE account_key = ?',
                parameters: [accountKey],
            });
            const count = result.success ? result.payload[0]?.count : undefined;

            return typeof count === 'number' ? count : 0;
        },
    });
    const syncStatus = useQuery({
        queryKey: transactionStoreQueryKeys.syncStatus([accountKey]),
        queryFn: () => transactionStore.getSyncStatus([accountKey]),
    });

    const transactions = useMemo(
        () => (rows.data ?? []).map(row => enhanceTransaction(row.transaction, account)),
        [rows.data, account],
    );

    const status = syncStatus.data?.[0];
    const isSyncing = status?.status === 'syncing' || status?.status === 'queued';
    // Still waiting for its first sync, unless that failed: then there is nothing to wait for and
    // the status tells why.
    const isAwaitingFirstSync = status?.lastSyncedAt === null && status.lastError === null;

    return {
        transactions,
        storedCount: storedCount.data ?? 0,
        syncStatus: status,
        isLoading:
            rows.isPending || (transactions.length === 0 && (isSyncing || isAwaitingFirstSync)),
        isSyncing,
        requestFullHistory: () => {
            void transactionStore.requestSync({ accountKeys: [accountKey], mode: 'full' });
        },
    };
};
