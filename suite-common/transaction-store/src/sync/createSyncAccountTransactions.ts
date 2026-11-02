import { type Result, err, ok } from '@trezor/type-utils';

import type { TransactionRepositoryDep } from '../repository/createTransactionRepository';
import type { TransactionSourceDep, TransactionsPageCursor } from '../source/transactionSource';
import type { SyncMode, TransactionSourceErrorType } from '../transactionStoreTypes';

export type SyncAccountTransactionsDeps = TransactionRepositoryDep &
    TransactionSourceDep & {
        now: () => number;
    };

export type SyncAccountTransactionsParams = {
    accountKey: string;
    mode: SyncMode;
};

export type SyncAccountTransactions = (
    params: SyncAccountTransactionsParams,
) => Promise<Result<void, TransactionSourceErrorType>>;

export type SyncAccountTransactionsDep = { syncAccountTransactions: SyncAccountTransactions };

export const createSyncAccountTransactions =
    (deps: SyncAccountTransactionsDeps): SyncAccountTransactions =>
    async ({ accountKey, mode }) => {
        const syncState = await deps.transactionRepository.selectSyncState(accountKey);
        const hasStoredHistory = syncState.lastSyncedAt !== null;
        // A complete history only ever grows at its newest end.
        const isWalkingToTheEnd = mode === 'full' && !syncState.isComplete;
        let { isComplete } = syncState;
        // Where the source said the next page starts; the newest page to begin with.
        let nextPage: TransactionsPageCursor | undefined;

        for (;;) {
            const account = await deps.transactionRepository.selectAccount(accountKey);

            if (account === undefined) {
                return ok();
            }

            const pageResult = await deps.transactionSource.fetchTransactionsPage({
                account,
                after: nextPage,
            });

            if (!pageResult.success) {
                await deps.transactionRepository.updateSyncState({
                    accountKey,
                    isComplete,
                    lastSyncedAt: syncState.lastSyncedAt,
                    lastError: pageResult.error,
                });

                return err(pageResult.error);
            }

            // Removed while the page was on its way; its rows are gone and must stay gone (the
            // foreign key refuses them anyway, should it go after this).
            if ((await deps.transactionRepository.selectAccount(accountKey)) === undefined) {
                return ok();
            }

            const { transactions } = pageResult.payload;
            const storedTxids = await deps.transactionRepository.selectStoredTxids({
                accountKey,
                txids: transactions.map(({ txid }) => txid),
            });
            // Each page is a write of its own, so lists fill in while a long history syncs.
            await deps.transactionRepository.upsertTransactions({ account, transactions });

            nextPage = pageResult.payload.nextPage;

            if (nextPage === undefined) {
                isComplete = true;
                break;
            }

            const hasReachedStoredHistory = storedTxids.size > 0;
            // The first sync stops at the newest page; `full` fills in the rest on demand.
            const isLatestDone = !hasStoredHistory || hasReachedStoredHistory;

            if (!isWalkingToTheEnd && isLatestDone) {
                break;
            }
        }

        await deps.transactionRepository.updateSyncState({
            accountKey,
            isComplete,
            lastSyncedAt: deps.now(),
            lastError: null,
        });

        return ok();
    };
