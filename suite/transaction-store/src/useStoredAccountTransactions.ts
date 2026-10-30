import { useEffect, useMemo } from 'react';

import {
    type SuspiciousTransactionsContext,
    type TransactionSearch,
    type TransactionSourceErrorType,
    selectAccountTransactions,
    toTransactionStoreQuery,
    transactionStoreDb,
} from '@suite-common/transaction-store';
import type { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { injectEnsureTransactionStore } from './createEnsureTransactionStore';
import { useTransactionStoreQuery } from './useTransactionStoreQuery';

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

export type AccountSyncState = {
    isSyncing: boolean;
    /** The whole history is stored, not just its newest part. */
    isComplete: boolean;
    lastSyncedAt: number | null;
    lastError: TransactionSourceErrorType | null;
};

export type StoredAccountTransactions = {
    /** The page, pending transactions first, ready for the transaction list. */
    transactions: WalletAccountTransaction[];
    /** How many of them the store holds, which may be short of the history while it syncs. */
    storedCount: number;
    /** `undefined` until the account was first asked for. */
    syncState: AccountSyncState | undefined;
    /** Nothing to show yet: the page is loading, or the first sync has not brought anything. */
    isLoading: boolean;
    /** Asks the store for the account's whole history, page by page in its worker. */
    requestFullHistory: () => void;
};

/**
 * An account's history from the transaction store, a page at a time. Asking is what makes the
 * store download it (its newest page, the rest on `requestFullHistory`); after that it stays
 * fresh as the app refreshes the account, and the store sends new rows on every change.
 */
export const useStoredAccountTransactions = ({
    account,
    page,
    perPage,
    contract,
    search,
    hideSuspicious,
}: UseStoredAccountTransactionsParams): StoredAccountTransactions => {
    const { ensureTransactionStore } = useServices(injectEnsureTransactionStore);
    const accountKey = account.key;

    useEffect(() => {
        void ensureTransactionStore().transactionStore.ensureSynced([accountKey]);
    }, [ensureTransactionStore, accountKey]);

    const queries = useMemo(() => {
        const transactions = selectAccountTransactions({
            accountKey,
            symbol: account.symbol,
            contract,
            search,
            hideSuspicious,
        });

        return {
            page: toTransactionStoreQuery(
                transactions
                    .select('t.data')
                    // Pending first, then the newest.
                    .orderBy(eb => eb('t.block_height', 'is', null), 'desc')
                    .orderBy('t.block_time', 'desc')
                    .orderBy('t.txid')
                    .limit(perPage)
                    .offset((page - 1) * perPage),
            ),
            count: toTransactionStoreQuery(
                transactions.select(eb => eb.fn.countAll<number>().as('count')),
            ),
            syncState: toTransactionStoreQuery(
                transactionStoreDb
                    .selectFrom('sync_state')
                    .select(['is_syncing', 'is_complete', 'last_synced_at', 'last_error'])
                    .where('account_key', '=', accountKey),
            ),
        };
    }, [accountKey, account.symbol, contract, search, hideSuspicious, page, perPage]);

    const rows = useTransactionStoreQuery(queries.page);
    const count = useTransactionStoreQuery(queries.count);
    const syncStateRow = useTransactionStoreQuery(queries.syncState).rows?.[0];

    const transactions = useMemo(
        () => (rows.rows ?? []).map(row => enhanceTransaction(JSON.parse(row.data), account)),
        [rows.rows, account],
    );
    const syncState = syncStateRow && {
        isSyncing: syncStateRow.is_syncing === 1,
        isComplete: syncStateRow.is_complete === 1,
        lastSyncedAt: syncStateRow.last_synced_at,
        lastError: syncStateRow.last_error,
    };
    // The first sync is still to bring something.
    const isFirstSyncPending =
        syncState === undefined ||
        (syncState.lastSyncedAt === null && syncState.lastError === null);

    return {
        transactions,
        storedCount: count.rows?.[0]?.count ?? 0,
        syncState,
        isLoading: rows.rows === undefined || (transactions.length === 0 && isFirstSyncPending),
        requestFullHistory: () => {
            void ensureTransactionStore().transactionStore.requestFullHistory(accountKey);
        },
    };
};
