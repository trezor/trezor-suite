import { useMemo } from 'react';

import { useQuery } from '@suite-common/react-query';
import type {
    AccountSyncStatus,
    SuspiciousTransactionsContext,
    TransactionSearch,
} from '@suite-common/transaction-store';
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
    /**
     * Only the transactions moving this asset: a token's contract, or `null` for the network's
     * own coin (e.g. an asset's detail). Left out, all of them.
     */
    contract?: string | null;
    /** Only the transactions this search matches, searched in the worker; see `toTransactionSearch`. */
    search?: TransactionSearch;
    /** Without the suspicious ones, filtered in the worker, so pages and counts stay right. */
    hideSuspicious?: SuspiciousTransactionsContext;
};

export type StoredAccountTransactions = {
    /** The page, pending transactions first, ready for the transaction list. */
    transactions: WalletAccountTransaction[];
    /** How many of them the store holds, which may be short of the history while it syncs. */
    storedCount: number;
    syncStatus: AccountSyncStatus | undefined;
    /** Nothing to show yet: the page is loading, or the first sync has not brought anything. */
    isLoading: boolean;
    isSyncing: boolean;
    /** Asks the store for the account's whole history, page by page in its worker. */
    requestFullHistory: () => void;
};

/**
 * An account's history from the transaction store, a page at a time. Asking is what makes the
 * store download it (its newest page, the rest on `requestFullHistory`); after that it stays
 * fresh as the app refreshes the account, and the queries refetch on the store's events.
 */
export const useStoredAccountTransactions = ({
    account,
    page,
    perPage,
    contract,
    search,
    hideSuspicious,
}: UseStoredAccountTransactionsParams): StoredAccountTransactions => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const { transactionStore } = getTransactionStoreService();
    const accountKey = account.key;

    useTransactionStoreInvalidation();

    const rows = useQuery({
        queryKey: transactionStoreQueryKeys.accountTransactions(accountKey, {
            page,
            perPage,
            contract,
            search,
            hideSuspicious,
        }),
        // Lazy: the first time the account is asked for, its newest history is downloaded first.
        queryFn: async () => {
            await transactionStore.ensureSynced([accountKey]);

            return transactionStore.selectTransactions({
                accountKeys: [accountKey],
                contract,
                search,
                hideSuspicious,
                limit: perPage,
                offset: (page - 1) * perPage,
            });
        },
        // The previous page stays on screen while the next one is read from the worker.
        placeholderData: previous => previous,
    });
    const storedCount = useQuery({
        queryKey: transactionStoreQueryKeys.accountTransactions(accountKey, {
            count: contract,
            search,
            hideSuspicious,
        }),
        queryFn: async () => {
            await transactionStore.ensureSynced([accountKey]);

            return transactionStore.countTransactions({
                accountKeys: [accountKey],
                contract,
                search,
                hideSuspicious,
            });
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
    const isSyncing = status?.status === 'syncing';

    return {
        transactions,
        storedCount: storedCount.data ?? 0,
        syncStatus: status,
        // Pending covers the first download too, as the query waits for it.
        isLoading: rows.isPending,
        isSyncing,
        requestFullHistory: () => {
            void transactionStore.requestFullHistory(accountKey);
        },
    };
};
